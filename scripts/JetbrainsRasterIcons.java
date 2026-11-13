import java.awt.Color;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.HashMap;
import java.util.Map;
import javax.imageio.ImageIO;

class JetbrainsRasterIcons {
  static Map<String, String> palette = new HashMap<>();

  static String paint(int argb, boolean colored) {
    int r = (argb >> 16) & 255, g = (argb >> 8) & 255, b = argb & 255;
    float[] hsv = Color.RGBtoHSB(r, g, b, null);
    String role;
    float h = hsv[0] * 360;
    if (hsv[1] < 0.12) role = hsv[2] < 0.4 ? "near" : colored && hsv[2] > 0.9 ? "pitch" : hsv[2] > 0.85 ? "voice" : "murmur";
    else if (h < 12 || h >= 345) role = "sharp";
    else if (h < 45) role = "said";
    else if (h < 75) role = "flat";
    else if (h < 165) role = "grown";
    else if (h < 195) role = "form";
    else if (h < 265) role = "cue";
    else role = h < 315 ? "nudge" : "call";
    return palette.get(role);
  }

  public static void main(String[] args) throws Exception {
    for (String line : Files.readAllLines(Path.of(args[2]))) {
      var parts = line.split("\\t");
      palette.put(parts[0], parts[1]);
    }
    Path output = Path.of(args[1]);
    Files.createDirectories(output);
    int count = 0;
    try (var files = Files.list(Path.of(args[0]))) {
      for (Path source : files.filter(p -> p.toString().endsWith(".png")).sorted().toList()) {
        var image = ImageIO.read(source.toFile());
        if (image == null) throw new IllegalArgumentException("invalid PNG: " + source);
        int w = image.getWidth(), h = image.getHeight();
        boolean colored = false;
        for (int y = 0; y < h; y++) for (int x = 0; x < w; x++) {
          int rgb = image.getRGB(x, y);
          if ((rgb >>> 24) > 128 && Color.RGBtoHSB((rgb >> 16) & 255, (rgb >> 8) & 255, rgb & 255, null)[1] > 0.35) colored = true;
        }
        var recolored = new java.awt.image.BufferedImage(w, h, java.awt.image.BufferedImage.TYPE_INT_ARGB);
        for (int y = 0; y < h; y++) for (int x = 0; x < w; x++) {
          int pixel = image.getRGB(x, y);
          int rgb = Integer.parseInt(paint(pixel, colored).substring(1), 16);
          recolored.setRGB(x, y, (pixel & 0xff000000) | rgb);
        }
        ImageIO.write(recolored, "png", output.resolve(source.getFileName()).toFile());
        count++;
      }
    }
    System.out.println(count + " raster icon sources recolored with native alpha and resolution");
  }
}
