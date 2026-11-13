import com.intellij.ide.plugins.cl.PluginAwareClassLoader;
import com.intellij.ide.ui.UITheme;
import com.intellij.openapi.extensions.PluginDescriptor;
import com.intellij.openapi.extensions.PluginId;
import com.intellij.openapi.util.IconLoader;
import com.intellij.ui.scale.ScaleContext;
import com.intellij.ui.scale.ScaleType;
import java.awt.Image;
import java.awt.image.BufferedImage;
import java.net.URL;
import java.net.URLClassLoader;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.TreeSet;
import javax.imageio.ImageIO;
import javax.swing.Icon;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;
import tools.jackson.databind.node.ObjectNode;

public class VerifyJetbrainsIcons {
  static class SourceLoader extends ClassLoader implements PluginAwareClassLoader {
    private final PluginId id;
    SourceLoader(String id) { this.id = PluginId.getId(id); }
    public PluginDescriptor getPluginDescriptor() { return null; }
    public PluginId getPluginId() { return id; }
    public String getModuleId() { return null; }
    public long getEdtTime() { return 0; }
    public long getBackgroundTime() { return 0; }
    public long getLoadedClassCount() { return 0; }
    public Collection<Path> getFiles() { return List.of(); }
    public int getState() { return ACTIVE; }
    public Class<?> tryLoadingClass(String name, boolean force) throws ClassNotFoundException { return loadClass(name); }
    public Class<?> loadClassInsideSelf(String name) throws ClassNotFoundException { return loadClass(name); }
    public String getPackagePrefix() { return null; }
    public kotlinx.coroutines.CoroutineScope getPluginCoroutineScope() { return null; }
  }

  record Pixels(int visible, double alpha, double contrast) {}

  static double linear(double value) {
    return value <= .04045 ? value / 12.92 : Math.pow((value + .055) / 1.055, 2.4);
  }

  static double luminance(double red, double green, double blue) {
    return .2126 * linear(red) + .7152 * linear(green) + .0722 * linear(blue);
  }

  static Pixels pixels(BufferedImage image) {
    int visible = 0;
    double mass = 0, peak = 1, background = 24.0 / 255;
    double base = luminance(background, background, background);
    for (int y = 0; y < image.getHeight(); y++) {
      for (int x = 0; x < image.getWidth(); x++) {
        int pixel = image.getRGB(x, y);
        double alpha = ((pixel >>> 24) & 255) / 255.0;
        mass += alpha;
        if (alpha > 0) visible++;
        if (alpha <= .05) continue;
        double red = ((pixel >>> 16) & 255) / 255.0 * alpha + background * (1 - alpha);
        double green = ((pixel >>> 8) & 255) / 255.0 * alpha + background * (1 - alpha);
        double blue = (pixel & 255) / 255.0 * alpha + background * (1 - alpha);
        double light = luminance(red, green, blue);
        peak = Math.max(peak, (Math.max(light, base) + .05) / (Math.min(light, base) + .05));
      }
    }
    return new Pixels(visible, mass, peak);
  }

  static BufferedImage render(Icon icon, double scale) {
    var context = scale == 1 ? ScaleContext.createIdentity() : ScaleContext.create(ScaleType.OBJ_SCALE.of(scale));
    Image image = IconLoader.toImage(icon, context);
    if (image == null || image.getWidth(null) < 1 || image.getHeight(null) < 1) throw new IllegalStateException("empty image dimensions");
    var output = new BufferedImage(image.getWidth(null), image.getHeight(null), BufferedImage.TYPE_INT_ARGB);
    var graphics = output.createGraphics();
    graphics.drawImage(image, 0, 0, null);
    graphics.dispose();
    return output;
  }

  static void compare(BufferedImage actual, BufferedImage source, boolean exactAlpha) {
    if (actual.getWidth() != source.getWidth() || actual.getHeight() != source.getHeight()) {
      throw new IllegalStateException("source dimensions " + source.getWidth() + "x" + source.getHeight() + ", replacement " + actual.getWidth() + "x" + actual.getHeight());
    }
    Pixels before = pixels(source), after = pixels(actual);
    if (before.visible() > 0 && after.visible() == 0) throw new IllegalStateException("replacement is blank but source is visible");
    if (exactAlpha) {
      for (int y = 0; y < actual.getHeight(); y++) {
        for (int x = 0; x < actual.getWidth(); x++) {
          if ((actual.getRGB(x, y) >>> 24) != (source.getRGB(x, y) >>> 24)) throw new IllegalStateException("raster alpha changed at " + x + "," + y);
        }
      }
    } else if (before.alpha() > 0) {
      double ratio = after.alpha() / before.alpha();
      if (ratio < .9 || ratio > 1.1) throw new IllegalStateException("SVG alpha footprint changed: " + ratio);
    }
  }

  public static void main(String[] args) throws Exception {
    if (args.length < 3) throw new IllegalArgumentException("expected resources, coverage.json, report.json, optional inventory directory");
    Path resources = Path.of(args[0]).toAbsolutePath(), report = Path.of(args[2]).toAbsolutePath();
    Path inventory = args.length > 3 ? Path.of(args[3]).toAbsolutePath() : null;
    var mapper = new JsonMapper();
    var coverage = mapper.readTree(Path.of(args[1]).toFile());
    var parent = VerifyJetbrainsIcons.class.getClassLoader();
    var loader = new URLClassLoader(new URL[]{resources.toUri().toURL()}, parent);
    var originalLoader = inventory == null ? null : new URLClassLoader(new URL[]{inventory.resolve("sources").toUri().toURL()}, parent);
    var sources = new HashMap<String, JsonNode>();
    for (var row : coverage.path("records")) sources.putIfAbsent(row.path("target").asString().substring(1), row);
    var failures = new ArrayList<Map<String, Object>>();
    var results = new ArrayList<Map<String, Object>>();
    var lowContrast = new ArrayList<Map<String, Object>>();
    int mappings = 0;
    for (String variant : List.of("sotto.theme.json", "sotto-black.theme.json")) {
      var tree = (ObjectNode) mapper.readTree(resources.resolve(variant).toFile());
      tree.remove("parentTheme");
      var theme = UITheme.Companion.loadDeprecatedFromJson$intellij_platform_ide_impl(mapper.writeValueAsBytes(tree), "proof", loader);
      var scopes = new HashMap<String, ClassLoader>();
      for (var row : coverage.path("records")) {
        String plugin = row.path("pluginId").isNull() ? "" : row.path("pluginId").asString();
        ClassLoader sourceLoader = plugin.isEmpty() ? parent : scopes.computeIfAbsent(plugin, SourceLoader::new);
        String path = row.path("path").asString(), target = row.path("target").asString();
        for (String key : List.of(path, "/" + path)) {
          String actual = theme.patcher.patchPath(key, sourceLoader);
          if (!Objects.equals(actual, target) || loader.getResource(target.substring(1)) == null || theme.patcher.getContextClassLoader(key, sourceLoader) != loader) {
            failures.add(Map.of("phase", "mapping", "variant", variant, "plugin", plugin, "path", key, "expected", target, "actual", Objects.toString(actual)));
          }
          mappings++;
        }
      }
    }
    IconLoader.activate();
    IconLoader.setUseDarkIcons(true);
    var assets = new TreeSet<String>();
    try (var files = Files.walk(resources)) {
      files.filter(path -> path.toString().endsWith(".svg") || path.toString().endsWith(".png")).forEach(path -> assets.add(resources.relativize(path).toString()));
    }
    int scaled = 0, sourceChecks = 0, retinaChecks = 0, blanks = 0;
    for (String asset : assets) {
      var row = sources.get(asset);
      String originalPath = row == null ? asset : row.path("selectedPath").asString();
      try {
        var icon = IconLoader.getIcon("/" + asset, loader);
        var one = render(icon, 1);
        boolean checkTwo = Math.max(one.getWidth(), one.getHeight()) <= 64;
        var two = checkTwo ? render(icon, 2) : null;
        if (checkTwo) scaled++;
        boolean compared = inventory != null && row != null && asset.startsWith("icons/sotto/imported/");
        if (compared) {
          String source = row.path("selectedSource").asString();
          boolean raster = source.endsWith(".png");
          if (raster) {
            compare(one, ImageIO.read(inventory.resolve(source).toFile()), true);
            String retina = row.path("retinaSource").asString("");
            if (two != null && !retina.isEmpty()) {
              compare(two, ImageIO.read(inventory.resolve(retina).toFile()), true);
              retinaChecks++;
            }
          } else {
            var original = IconLoader.getIcon("/" + Path.of(source).getFileName(), originalLoader);
            compare(one, render(original, 1), false);
            if (two != null) compare(two, render(original, 2), false);
          }
          sourceChecks++;
        }
        Pixels measured = pixels(one);
        if (measured.visible() == 0) {
          blanks++;
          if (!compared) throw new IllegalStateException("blank asset without a source comparison");
        }
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("asset", asset); result.put("path", originalPath);
        result.put("width", one.getWidth()); result.put("height", one.getHeight());
        result.put("scaled", checkTwo); result.put("sourceCompared", compared);
        result.put("visiblePixels", measured.visible()); result.put("peakContrast", measured.contrast());
        results.add(result);
        if (measured.visible() > 0 && measured.contrast() < 3) lowContrast.add(result);
      } catch (Throwable error) {
        failures.add(Map.of("phase", "render", "asset", asset, "path", originalPath, "error", error.toString()));
      }
    }
    var summary = Map.of("mappings", mappings, "assets", assets.size(), "scaled", scaled, "sourceChecks", sourceChecks, "retinaChecks", retinaChecks, "sourceBlankAssets", blanks, "failures", failures.size(), "lowContrast", lowContrast.size());
    Files.createDirectories(report.getParent());
    mapper.writerWithDefaultPrettyPrinter().writeValue(report.toFile(), Map.of("summary", summary, "failures", failures, "lowContrast", lowContrast, "assets", results));
    System.out.println(mapper.writeValueAsString(summary));
    if (!failures.isEmpty()) System.exit(1);
  }
}
