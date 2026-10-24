import os
import sys
import math
import subprocess
from PIL import Image, ImageEnhance, ImageFilter, ImageOps

HERO_GEN = '/Users/dotclick/.gemini/antigravity-ide/brain/06e312a9-ad20-4ca8-a4ae-9ff46acf75a0/hero_penthouse_dark_1791262520335.jpg'
SATIN_GEN = '/Users/dotclick/.gemini/antigravity-ide/brain/06e312a9-ad20-4ca8-a4ae-9ff46acf75a0/manifesto_satin_gold_1791262552757.jpg'
MARBLE_GEN = '/Users/dotclick/.gemini/antigravity-ide/brain/06e312a9-ad20-4ca8-a4ae-9ff46acf75a0/dark_marble_gold_1791262574934.jpg'

PUBLIC_IMAGES = os.path.abspath('public/images')

def calc_mean_luma(im):
    rgb = im.convert('RGB')
    data = list(rgb.getdata())
    return sum(0.299 * r + 0.587 * g + 0.114 * b for r, g, b in data) / len(data)

def chiaroscuro_grade(im, target_luma=50.0):
    im = im.convert('RGB')
    w, h = im.size
    curr_luma = calc_mean_luma(im)
    
    # 1. Adjust brightness towards target
    if curr_luma > target_luma:
        ratio = target_luma / curr_luma
        # Stronger contrast for punchy chiaroscuro
        im = ImageEnhance.Contrast(im).enhance(1.4)
        im = ImageEnhance.Brightness(im).enhance(ratio * 0.96)
    
    # 2. Warm gold highlight tone curve + cool shadow crush
    r_lut = [min(255, int(i * 1.05)) for i in range(256)]
    g_lut = [min(255, int(i * 1.02)) for i in range(256)]
    b_lut = [max(0, int(i * 0.90)) for i in range(256)]
    r, g, b = im.split()
    r = r.point(r_lut)
    g = g.point(g_lut)
    b = b.point(b_lut)
    im = Image.merge('RGB', (r, g, b))
    
    # 3. Subtle dark vignette to draw focus into key lights and seat borders near #0B0B0B
    vignette = Image.new('RGB', (w, h), (11, 11, 11))
    vig_mask = Image.new('L', (w, h), 0)
    cx, cy = w / 2.0, h / 2.0
    max_dist = math.hypot(cx, cy)
    
    step = 4
    for x in range(0, w, step):
        for y in range(0, h, step):
            d = math.hypot((x - cx) / cx, (y - cy) / cy)
            # Vignette kicks in at d > 0.6
            v = int(255 * max(0, min(1.0, (d - 0.6) / 0.65)))
            v_val = int(v * 0.35) # 35% edge darkness
            for dx in range(step):
                for dy in range(step):
                    if x + dx < w and y + dy < h:
                        vig_mask.putpixel((x + dx, y + dy), v_val)
                        
    vig_mask = vig_mask.filter(ImageFilter.GaussianBlur(step * 4))
    im = Image.composite(vignette, im, vig_mask)
    return im

def export_all_formats(im, base_name, max_w=None, max_h=None, jpg_q=82, webp_q=82):
    if max_w and max_h:
        # Resize preserving aspect ratio or fitting
        im = im.copy()
        im.thumbnail((max_w, max_h), Image.Resampling.LANCZOS)
    
    jpg_path = os.path.join(PUBLIC_IMAGES, f'{base_name}.jpg')
    webp_path = os.path.join(PUBLIC_IMAGES, f'{base_name}.webp')
    avif_path = os.path.join(PUBLIC_IMAGES, f'{base_name}.avif')
    
    # Save JPG
    im.save(jpg_path, 'JPEG', quality=jpg_q, optimize=True, progressive=True)
    # Save WebP
    im.save(webp_path, 'WEBP', quality=webp_q, method=6)
    
    # Save AVIF via ffmpeg with SVT-AV1
    subprocess.run([
        'ffmpeg', '-y', '-loglevel', 'error',
        '-i', jpg_path,
        '-c:v', 'libsvtav1',
        '-crf', '32',
        '-pix_fmt', 'yuv420p',
        avif_path
    ], check=True)
    
    luma = calc_mean_luma(im)
    jpg_kb = os.path.getsize(jpg_path) / 1024
    webp_kb = os.path.getsize(webp_path) / 1024
    avif_kb = os.path.getsize(avif_path) / 1024
    print(f'Done {base_name}: size={im.size}, luma={luma:.1f}, JPG={jpg_kb:.1f}KB, WebP={webp_kb:.1f}KB, AVIF={avif_kb:.1f}KB')

def main():
    print('Starting full imagery regrade & optimization...')
    
    # 1. Hero
    hero_raw = Image.open(HERO_GEN).convert('RGB')
    # Upscale / resize to 2400x1339
    hero_scaled = hero_raw.resize((2400, 1339), Image.Resampling.LANCZOS)
    export_all_formats(hero_scaled, 'hero-penthouse-dusk', jpg_q=82, webp_q=82)
    
    # 2. Dark Marble
    marble_raw = Image.open(MARBLE_GEN).convert('RGB')
    marble_scaled = marble_raw.resize((2000, 1116), Image.Resampling.LANCZOS)
    export_all_formats(marble_scaled, 'dark-marble', jpg_q=82, webp_q=82)
    
    # 3. Manifesto Satin
    satin_raw = Image.open(SATIN_GEN).convert('RGB')
    satin_scaled = satin_raw.resize((2000, 1116), Image.Resampling.LANCZOS)
    export_all_formats(satin_scaled, 'manifesto-satin', jpg_q=82, webp_q=82)
    
    # 4. Riad Courtyard Night
    riad_raw = Image.open(os.path.join(PUBLIC_IMAGES, 'riad-courtyard-night.jpg')).convert('RGB')
    riad_graded = chiaroscuro_grade(riad_raw, target_luma=42.0)
    export_all_formats(riad_graded, 'riad-courtyard-night', jpg_q=82, webp_q=82)
    
    # 5. Interludes: casablanca-art-deco, riad-courtyard-dusk, tangier-terrace-night
    for name in ['casablanca-art-deco', 'riad-courtyard-dusk', 'tangier-terrace-night']:
        orig = Image.open(os.path.join(PUBLIC_IMAGES, f'{name}.jpg')).convert('RGB')
        # Regrade tone slightly darker to ~52 luma and recompress
        graded = chiaroscuro_grade(orig, target_luma=52.0)
        export_all_formats(graded, name, jpg_q=80, webp_q=80)
        
    # 6. Two Horizons: executive-interior (owner) & concierge-hub (conciergerie)
    exec_raw = Image.open(os.path.join(PUBLIC_IMAGES, 'executive-interior.jpg')).convert('RGB')
    exec_graded = chiaroscuro_grade(exec_raw, target_luma=48.0)
    export_all_formats(exec_graded, 'executive-interior', jpg_q=82, webp_q=82)
    
    conc_raw = Image.open(os.path.join(PUBLIC_IMAGES, 'concierge-hub.jpg')).convert('RGB')
    conc_graded = chiaroscuro_grade(conc_raw, target_luma=48.0)
    export_all_formats(conc_graded, 'concierge-hub', jpg_q=82, webp_q=82)
    
    # 7. Property Cards
    prop_names = [
        'property-harbour',
        'property-aurora',
        'property-palm',
        'property-marina',
        'property-skyline',
        'property-gardencourt'
    ]
    for p in prop_names:
        img_raw = Image.open(os.path.join(PUBLIC_IMAGES, f'{p}.jpg')).convert('RGB')
        # Grade to ~48 luma
        img_graded = chiaroscuro_grade(img_raw, target_luma=48.0)
        export_all_formats(img_graded, p, jpg_q=82, webp_q=82)
        
    # 8. OG Image
    marble_og = marble_raw.resize((1200, 630), Image.Resampling.LANCZOS)
    satin_og = satin_raw.resize((1200, 630), Image.Resampling.LANCZOS)
    mask = Image.new('L', (1200, 630), 0)
    for x in range(1200):
        val = int(255 * (max(0, x - 550) / 650.0) ** 1.5)
        for y in range(630):
            mask.putpixel((x, y), min(255, val))
    mask = mask.filter(ImageFilter.GaussianBlur(25))
    og = Image.composite(satin_og, marble_og, mask)
    
    # Calm dark center vignette
    vignette = Image.new('RGB', (1200, 630), (11, 11, 11))
    vig_mask = Image.new('L', (1200, 630), 0)
    for x in range(0, 1200, 4):
        for y in range(0, 630, 4):
            d = math.hypot((x - 600) / 600.0, (y - 315) / 315.0)
            v = int(120 * max(0, 1.0 - d * 0.9))
            for dx in range(4):
                for dy in range(4):
                    if x+dx < 1200 and y+dy < 630:
                        vig_mask.putpixel((x+dx, y+dy), v)
    og = Image.composite(vignette, og, vig_mask.filter(ImageFilter.GaussianBlur(30)))
    export_all_formats(og, 'og-image', jpg_q=85, webp_q=85)
    
    print('All imagery processed successfully!')

if __name__ == '__main__':
    main()
