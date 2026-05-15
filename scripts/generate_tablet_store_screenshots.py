from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "assets" / "play-store-tablet-screenshots"
LOGO = ROOT / "assets" / "logo.png"

W, H = 1920, 1080
BG = "#F5F1E8"
INK = "#073D32"
MUTED = "#5E6B62"
CARD = "#FFFDF7"
LINE = "#DDD0BB"
GREEN = "#075E49"
PALE = "#EEE4D4"


def font(size, bold=False):
    name = "arialbd.ttf" if bold else "arial.ttf"
    return ImageFont.truetype(f"C:/Windows/Fonts/{name}", size)


def rounded(draw, box, radius, fill, outline=None, width=1):
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)


def shadow_card(base, box, radius=34, fill=CARD, outline=LINE):
    x1, y1, x2, y2 = box
    shadow = Image.new("RGBA", base.size, (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow)
    sd.rounded_rectangle((x1 + 10, y1 + 16, x2 + 10, y2 + 16), radius=radius, fill=(36, 28, 16, 28))
    shadow = shadow.filter(ImageFilter.GaussianBlur(18))
    base.alpha_composite(shadow)
    d = ImageDraw.Draw(base)
    rounded(d, box, radius, fill, outline, 2)


def draw_logo(draw, base, x, y, size=56):
    rounded(draw, (x, y, x + size, y + size), size // 2, "#EAF1EB", "#D5DED6", 2)
    if LOGO.exists():
        img = Image.open(LOGO).convert("RGBA")
        img.thumbnail((size - 16, size - 16))
        base.alpha_composite(img, (x + (size - img.width) // 2, y + (size - img.height) // 2))
    else:
        draw.text((x + 18, y + 12), "N", font=font(28, True), fill=INK)


def draw_phone_frame(base, x, y, w, h, variant):
    d = ImageDraw.Draw(base)
    rounded(d, (x, y, x + w, y + h), 42, "#ECE2D2", "#D0BFA7", 3)
    rounded(d, (x + 22, y + 22, x + w - 22, y + h - 22), 32, "#FBF7EE")

    # Header
    rounded(d, (x + 50, y + 54, x + w - 50, y + 132), 36, CARD, LINE, 2)
    draw_logo(d, base, x + 76, y + 68, 44)
    d.text((x + 138, y + 80), "NightRecall", font=font(27, True), fill=INK)
    rounded(d, (x + w - 130, y + 72, x + w - 78, y + 124), 26, "#E9F0E8", "#D5DED6", 2)

    if variant == "home":
        shadow_card(base, (x + 52, y + 170, x + w - 52, y + 430), 30)
        d.text((x + 92, y + 205), "Keep tonight clear.", font=font(38, True), fill=INK)
        d.text((x + 92, y + 260), "One prompt, one recall habit before sleep.", font=font(21), fill=MUTED)
        rounded(d, (x + 92, y + 318, x + 245, y + 360), 20, "#EAF2EC", "#C8DACD", 1)
        d.text((x + 112, y + 328), "22:30 reminder", font=font(17, True), fill=GREEN)
        rounded(d, (x + 92, y + 378, x + w - 92, y + 416), 18, PALE)
        for i, label in enumerate(("3 Questions", "3 Photos", "0 Ready")):
            cx = x + (92, 252, 376)[i]
            d.text((cx, y + 382), label, font=font(16, True), fill=INK)

        shadow_card(base, (x + 52, y + 470, x + w - 52, y + 735), 30)
        rounded(d, (x + 92, y + 510, x + 152, y + 570), 24, "#E6E0D4")
        d.text((x + 178, y + 498), "Make your next", font=font(26, True), fill=INK)
        d.text((x + 178, y + 536), "question before", font=font(26, True), fill=INK)
        d.text((x + 178, y + 574), "the day fades", font=font(26, True), fill=INK)
        d.text((x + 178, y + 620), "Start with a photo or note.", font=font(18), fill=MUTED)
        rounded(d, (x + 92, y + 660, x + w - 92, y + 715), 24, GREEN)
        d.text((x + 156, y + 673), "Create tonight's question", font=font(20, True), fill="white")
    else:
        shadow_card(base, (x + 52, y + 170, x + w - 52, y + 380), 30)
        d.text((x + 92, y + 205), "Saved learning", font=font(38, True), fill=INK)
        d.text((x + 92, y + 260), "Review only the points you chose to keep.", font=font(21), fill=MUTED)
        rounded(d, (x + 92, y + 310, x + w - 92, y + 350), 18, "#F3EBDD", "#DFCDB3", 1)

        for idx, top in enumerate((430, 590)):
            shadow_card(base, (x + 52, y + top, x + w - 52, y + top + 125), 26)
            rounded(d, (x + 86, y + top + 24, x + 148, y + top + 86), 18, "#E1D1BB")
            lines = (
                ("Image from an Instagram post",)
                if idx == 0
                else ("A short note became", "one recall point")
            )
            for line_idx, title in enumerate(lines):
                d.text((x + 172, y + top + 18 + line_idx * 28), title, font=font(20, True), fill=INK)
            d.text((x + 172, y + top + 72), "2 saved points", font=font(18), fill=MUTED)
            rounded(d, (x + w - 180, y + top + 42, x + w - 88, y + top + 82), 20, "#EAF2EC")
            d.text((x + w - 158, y + top + 51), "Review", font=font(16, True), fill=GREEN)


def make(path, headline, subhead, variant):
    base = Image.new("RGBA", (W, H), BG)
    d = ImageDraw.Draw(base)

    # Background shapes
    d.ellipse((-180, 720, 380, 1280), fill="#E9DFCE")
    d.ellipse((1450, -220, 2140, 470), fill="#E4EFE8")
    d.polygon([(1290, 120), (1740, 80), (1600, 510)], fill="#EFE5D4")

    draw_logo(d, base, 110, 94, 68)
    d.text((198, 108), "NightRecall", font=font(34, True), fill=INK)
    rounded(d, (380, 104, 462, 148), 22, "#EAF2EC", "#C8DACD", 1)
    d.text((400, 115), "FREE", font=font(15, True), fill=GREEN)

    d.text((110, 255), headline, font=font(66, True), fill=INK)
    d.text((112, 350), subhead, font=font(30), fill=MUTED)

    # Feature cards on the left
    items = [
        ("Capture", "Add a photo, screenshot, or short note."),
        ("Select", "Keep only the points that matter."),
        ("Recall", "Turn them into one focused question."),
    ]
    for i, (title, body) in enumerate(items):
        y = 470 + i * 130
        shadow_card(base, (112, y, 780, y + 92), 26)
        rounded(d, (148, y + 24, 194, y + 70), 18, "#EAF2EC")
        d.text((220, y + 20), title, font=font(24, True), fill=INK)
        d.text((220, y + 53), body, font=font(19), fill=MUTED)

    draw_phone_frame(base, 1130, 115, 520, 810, variant)

    base.convert("RGB").save(path, "PNG", optimize=True)


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    specs = [
        ("tablet-7in-01-home.png", "One question before sleep.", "Capture what mattered today and return to it tonight.", "home"),
        ("tablet-7in-02-library.png", "Save only what matters.", "Choose learning points, then review them from your library.", "library"),
        ("tablet-10in-01-home.png", "A quieter way to remember.", "NightRecall turns daily captures into focused recall.", "home"),
        ("tablet-10in-02-library.png", "Your saved points, ready tonight.", "Keep the signal, skip the noise, and review before bed.", "library"),
    ]
    for name, headline, subhead, variant in specs:
        make(OUT / name, headline, subhead, variant)
    print(str(OUT))


if __name__ == "__main__":
    main()
