import os
import random
from PIL import Image, ImageDraw, ImageFont

# Ensure assets directory exists
ASSETS_DIR = os.path.join(os.path.dirname(__file__), '..', 'public', 'assets')
if not os.path.exists(ASSETS_DIR):
    os.makedirs(ASSETS_DIR)

def create_player():
    img = Image.new('RGBA', (64, 64), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Modern Stealth Fighter (Bottom-Left style) - Nose UP
    c_body = '#2D3436' # Dark Grey
    c_light = '#636E72' # Lighter Grey
    c_glass = '#74B9FF' # Light Blue
    c_accent = '#D63031' # Red
    
    # Main Body / Fuselage
    draw.polygon([(32, 0), (24, 15), (24, 50), (32, 60), (40, 50), (40, 15)], fill=c_body, outline=c_light)
    
    # Wings (Swept back)
    # Root at ~25, Tip at ~45
    draw.polygon([(24, 25), (2, 45), (2, 55), (24, 50)], fill=c_body, outline=c_light) # Left
    draw.polygon([(40, 25), (62, 45), (62, 55), (40, 50)], fill=c_body, outline=c_light) # Right
    
    # Rear Stabilizers (V-tail)
    draw.polygon([(28, 50), (15, 62), (25, 62)], fill=c_body, outline=c_light)
    draw.polygon([(36, 50), (49, 62), (39, 62)], fill=c_body, outline=c_light)
    
    # Cockpit
    draw.ellipse([(28, 10), (36, 25)], fill=c_glass, outline='#0984E3')
    
    # Red Accents (Roundels on wings)
    draw.ellipse([(10, 45), (16, 51)], fill=c_accent)
    draw.ellipse([(48, 45), (54, 51)], fill=c_accent)
    
    # Engine Glow
    draw.polygon([(26, 60), (30, 60), (28, 64)], fill='#FF7675')
    draw.polygon([(34, 60), (38, 60), (36, 64)], fill='#FF7675')
    
    return img

def create_enemy(color, type_idx):
    img = Image.new('RGBA', (64, 64), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Enemies face DOWN (Nose at y=64)
    style = type_idx % 6
    
    if style == 0: # Middle-Left Style (Standard Fighter) - Nose DOWN
        c_body = '#2D3436'
        c_outline = '#636E72'
        c_glass = '#D63031' # Red cockpit for enemy
        
        # Wings (Swept Back)
        # Root at 20, Tip at 10 (Swept back relative to nose at 64)
        draw.polygon([(32, 25), (2, 15), (2, 30), (32, 45)], fill=c_body, outline=c_outline)
        draw.polygon([(32, 25), (62, 15), (62, 30), (32, 45)], fill=c_body, outline=c_outline)
        
        # Fuselage
        draw.ellipse([(26, 5), (38, 60)], fill=c_body, outline=c_outline)
        
        # Tail
        draw.polygon([(32, 10), (20, 0), (44, 0)], fill=c_body, outline=c_outline)
        
        # Cockpit
        draw.ellipse([(28, 40), (36, 50)], fill=c_glass)
        
        # Engines
        draw.ellipse([(10, 15), (18, 35)], fill='#111', outline=c_outline)
        draw.ellipse([(46, 15), (54, 35)], fill='#111', outline=c_outline)

    elif style == 1: # Red Biplane Style
        c_main = '#F56C6C' # Red
        c_dark = '#a32a2a'
        c_wood = '#d2691e'
        
        # Bottom Wing
        draw.rectangle([(10, 25), (54, 35)], fill=c_main, outline=c_dark)
        # Top Wing
        draw.rectangle([(4, 10), (60, 20)], fill=c_main, outline=c_dark)
        # Struts
        draw.line([(15, 20), (15, 25)], fill=c_wood, width=2)
        draw.line([(49, 20), (49, 25)], fill=c_wood, width=2)
        
        # Fuselage
        draw.ellipse([(26, 5), (38, 60)], fill=c_main, outline=c_dark)
        
        # Tail
        draw.polygon([(32, 5), (20, 0), (44, 0)], fill=c_main, outline=c_dark)
        
        # Propeller circle
        draw.ellipse([(24, 55), (40, 64)], fill='#aaaaaa', outline='black')
        draw.line([(32, 55), (32, 64)], fill='#333', width=1)
        draw.line([(24, 59.5), (40, 59.5)], fill='#333', width=1)
        
    elif style == 2: # Yellow Heavy Style
        c_main = '#E6A23C' # Yellow
        c_dark = '#9e6916'
        c_metal = '#777'
        
        # Wide Body
        draw.rectangle([(22, 10), (42, 55)], fill=c_main, outline=c_dark)
        
        # Wings
        # Straight wings
        draw.polygon([(22, 25), (0, 25), (0, 40), (22, 40)], fill=c_main, outline=c_dark)
        draw.polygon([(42, 25), (64, 25), (64, 40), (42, 40)], fill=c_main, outline=c_dark)
        
        # Front Engines
        draw.rectangle([(20, 50), (28, 60)], fill=c_metal, outline='black')
        draw.rectangle([(36, 50), (44, 60)], fill=c_metal, outline='black')
        
        # Cockpit (wide)
        draw.rectangle([(24, 40), (40, 48)], fill='#ff0000', outline='#550000')
        
        # Tail
        draw.polygon([(32, 10), (15, 0), (49, 0)], fill=c_dark)

    elif style == 3: # Top-Left Style (Canards + Forward Swept) - Nose DOWN
        c_body = '#2D3436'
        c_outline = '#B2BEC3'
        c_accent = '#E17055' # Orange
        
        # Canards (Front wings)
        draw.polygon([(32, 45), (20, 50), (20, 55), (32, 55)], fill=c_body, outline=c_outline)
        draw.polygon([(32, 45), (44, 50), (44, 55), (32, 55)], fill=c_body, outline=c_outline)
        
        # Main Wings (Swept Back)
        # Root at 35, Tip at 20 (Closer to tail)
        draw.polygon([(32, 35), (5, 20), (5, 30), (32, 50)], fill=c_body, outline=c_outline)
        draw.polygon([(32, 35), (59, 20), (59, 30), (32, 50)], fill=c_body, outline=c_outline)
        
        # Fuselage
        draw.rectangle([(28, 5), (36, 60)], fill=c_body, outline=c_outline)
        
        # Orange Stripes on wings
        draw.line([(10, 25), (25, 32)], fill=c_accent, width=2)
        draw.line([(39, 32), (54, 25)], fill=c_accent, width=2)
        
        # Cockpit
        draw.ellipse([(29, 45), (35, 55)], fill='#D63031')
        
        # Tail
        draw.polygon([(32, 10), (20, 0), (44, 0)], fill=c_body, outline=c_outline)

    elif style == 4: # Style based on Image2 (Stealth Fighter)
        c_body = '#2D3436'
        c_outline = '#7F8C8D'
        c_glass = '#74B9FF'
        
        # Main Fuselage
        draw.polygon([(32, 64), (26, 40), (26, 10), (38, 10), (38, 40)], fill=c_body, outline=c_outline)
        
        # Canards
        draw.polygon([(26, 50), (15, 45), (15, 55)], fill=c_body, outline=c_outline)
        draw.polygon([(38, 50), (49, 45), (49, 55)], fill=c_body, outline=c_outline)
        
        # Main Wings
        draw.polygon([(26, 35), (5, 20), (5, 10), (26, 25)], fill=c_body, outline=c_outline)
        draw.polygon([(38, 35), (59, 20), (59, 10), (38, 25)], fill=c_body, outline=c_outline)
        
        # Tail
        draw.polygon([(28, 5), (15, 0), (25, 0)], fill=c_body, outline=c_outline)
        draw.polygon([(36, 5), (49, 0), (39, 0)], fill=c_body, outline=c_outline)
        
        # Cockpit
        draw.ellipse([(29, 45), (35, 55)], fill=c_glass)

    elif style == 5: # Advanced Interceptor
        c_main = '#16A085' # Teal
        c_dark = '#0E6655'
        c_accent = '#F1C40F' # Yellow
        
        # Main Body
        draw.polygon([(32, 64), (24, 40), (24, 10), (40, 10), (40, 40)], fill=c_main, outline=c_dark)
        
        # Wings (Aggressive Delta)
        draw.polygon([(24, 35), (2, 25), (2, 45), (24, 50)], fill=c_main, outline=c_dark)
        draw.polygon([(40, 35), (62, 25), (62, 45), (40, 50)], fill=c_main, outline=c_dark)
        
        # Tail
        draw.polygon([(32, 10), (20, 0), (44, 0)], fill=c_main, outline=c_dark)
        
        # Cockpit
        draw.ellipse([(28, 40), (36, 50)], fill=c_accent)
        
        # Engine details
        draw.rectangle([(26, 5), (30, 15)], fill='#333')
        draw.rectangle([(34, 5), (38, 15)], fill='#333')

    return img

def create_bullet(is_enemy):
    w, h = (16, 32) if not is_enemy else (12, 12)
    img = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    if not is_enemy:
        draw.ellipse([(4, 0), (12, 32)], fill='#FFFF00')
    else:
        draw.ellipse([(0, 0), (12, 12)], fill='#FF0000', outline='#FFaaaa')
    return img

def create_laser():
    img = Image.new('RGBA', (16, 64), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Center is 7.5 (for 16px width, pixels 0-15)
    # We want symmetry around 7.5.
    
    # Core (White) - Width 2 (7,8)
    # Pixel 7: x[7,8]. Pixel 8: x[8,9].
    # Rectangle [(7,0), (8,64)] covers x=7,8. Width 2. Center 8.0.
    draw.rectangle([(7, 0), (8, 64)], fill='#FFFFFF')
    
    # Inner Glow (Cyan) - Width 6 (5,6, 7,8, 9,10)
    # Left: 5,6. Right: 9,10.
    draw.rectangle([(5, 0), (6, 64)], fill='#00FFFF')
    draw.rectangle([(9, 0), (10, 64)], fill='#00FFFF')
    
    # Outer Glow (Faint) - Width 10 (3,4...11,12)
    # Left: 3,4. Right: 11,12.
    draw.rectangle([(3, 0), (4, 64)], fill=(0, 255, 255, 100))
    draw.rectangle([(11, 0), (12, 64)], fill=(0, 255, 255, 100))
    
    return img

def create_powerup(type_name):
    img = Image.new('RGBA', (40, 40), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Colors
    color = '#67C23A'
    if type_name == 'lightning': color = '#E6A23C'
    if type_name == 'strengthen': color = '#F56C6C'
    
    # No background box, just the icon with color and outline
    
    if type_name == 'upgrade': # Arrow Up
        draw.polygon([(20, 5), (35, 20), (25, 20), (25, 35), (15, 35), (15, 20), (5, 20)], fill=color, outline='white')
    elif type_name == 'strengthen': # Star / Plus
        # Draw as one polygon to have a nice outline
        draw.polygon([
            (15, 5), (25, 5), (25, 15), (35, 15), (35, 25), (25, 25), 
            (25, 35), (15, 35), (15, 25), (5, 25), (5, 15), (15, 15)
        ], fill=color, outline='white')
    elif type_name == 'lightning': # Bolt
        draw.polygon([(25, 5), (15, 20), (22, 20), (15, 35), (30, 15), (20, 15)], fill=color, outline='white')
        
    return img

def create_lightning_vfx():
    # A tall lightning bolt for the visual effect
    w, h = 64, 256
    img = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Draw a jagged line
    points = [
        (32, 0), (15, 60), (45, 100), 
        (20, 160), (40, 200), (25, 256)
    ]
    # Draw with glow (multiple layers) - Thinner lines
    draw.line(points, fill='#FFFF00', width=4)
    draw.line(points, fill='#FFFFFF', width=1)
    
    # Add some branches
    draw.line([(15, 60), (5, 90)], fill='#FFFF00', width=2)
    draw.line([(40, 200), (55, 230)], fill='#FFFF00', width=2)
    
    return img

def create_background():
    w, h = 480, 1600
    img = Image.new('RGB', (w, h), '#000033')
    draw = ImageDraw.Draw(img)
    for _ in range(200):
        x = random.randint(0, w)
        y = random.randint(0, h)
        r = random.randint(1, 3)
        draw.ellipse([(x, y), (x+r, y+r)], fill=(255, 255, 255))
    return img

def create_explosion(frame_idx, total_frames=8):
    img = Image.new('RGBA', (64, 64), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    cx, cy = 32, 32
    progress = frame_idx / (total_frames - 1)
    
    # Max radius
    max_r = 30
    current_r = 5 + (max_r - 5) * (progress ** 0.5) # Expand quickly then slow
    
    # Colors based on progress
    if progress < 0.2:
        colors = ['#FFFFFF', '#FFFF00'] # White to Yellow
    elif progress < 0.4:
        colors = ['#FFFF00', '#FF9900'] # Yellow to Orange
    elif progress < 0.6:
        colors = ['#FF9900', '#FF0000'] # Orange to Red
    elif progress < 0.8:
        colors = ['#FF0000', '#555555'] # Red to Grey
    else:
        colors = ['#555555', '#333333'] # Grey to Dark
        
    # Helper to get RGBA from hex
    def hex_to_rgba(hex_color, a):
        hex_color = hex_color.lstrip('#')
        if len(hex_color) == 3:
            hex_color = ''.join([c*2 for c in hex_color])
        return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4)) + (a,)

    # Alpha fades out at the end
    alpha = 255
    if progress > 0.7:
        alpha = int(255 * (1 - (progress - 0.7) / 0.3))

    c1 = hex_to_rgba(colors[0], alpha)
    c2 = hex_to_rgba(colors[1], alpha)
    
    # Draw main blast
    draw.ellipse([(cx-current_r, cy-current_r), (cx+current_r, cy+current_r)], fill=c1)
    
    # Draw inner core
    inner_r = current_r * 0.6
    draw.ellipse([(cx-inner_r, cy-inner_r), (cx+inner_r, cy+inner_r)], fill=c2)
    
    # Draw some debris/irregularities
    random.seed(frame_idx) # Deterministic debris per frame
    if 0.2 < progress < 0.8:
        for _ in range(5):
            off_x = random.randint(-10, 10)
            off_y = random.randint(-10, 10)
            r_debris = random.randint(2, 6)
            draw.ellipse([(cx+off_x-r_debris, cy+off_y-r_debris), 
                          (cx+off_x+r_debris, cy+off_y+r_debris)], fill=c2)
                          
    return img

def create_big_enemy():
    # 128x128 Big Boss
    img = Image.new('RGBA', (128, 128), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    c_main = '#8E44AD' # Purple
    c_dark = '#5B2C6F'
    c_detail = '#D2B4DE'
    
    # Large Delta Wing
    draw.polygon([(64, 20), (10, 80), (10, 110), (64, 90)], fill=c_main, outline=c_dark) # Left
    draw.polygon([(64, 20), (118, 80), (118, 110), (64, 90)], fill=c_main, outline=c_dark) # Right
    
    # Main Fuselage
    draw.polygon([(64, 120), (40, 80), (40, 20), (54, 0), (74, 0), (88, 20), (88, 80)], fill=c_main, outline=c_dark)
    
    # Cockpit
    draw.polygon([(54, 40), (74, 40), (64, 70)], fill='#ff0000', outline='#550000')
    
    # Engines
    draw.rectangle([(30, 80), (50, 110)], fill=c_dark, outline=c_detail)
    draw.rectangle([(78, 80), (98, 110)], fill=c_dark, outline=c_detail)
    
    # Engine Glow
    draw.ellipse([(35, 105), (45, 115)], fill='#ff0000')
    draw.ellipse([(83, 105), (93, 115)], fill='#ff0000')
    
    return img

def main():
    # Create Sprite Sheet Canvas
    # Layout:
    # Row 1: Player (64x64) | Bullet P (16x32) | Bullet E (20x20) | Laser (16x64)
    # Row 2: Powerups (3x 40x40)
    # Row 3: Enemies (6x 64x64)
    # Row 4: Lightning VFX (64x256) | Big Enemy (128x128)
    # Row 5: Explosion (8x 64x64)
    
    sheet_w = 64 * 8 
    sheet_h = 64 + 40 + 64 + 20 + 260 + 80 + 128 # Added space just in case
    
    sheet = Image.new('RGBA', (sheet_w, sheet_h), (0,0,0,0))
    
    # 1. Player
    player = create_player()
    sheet.paste(player, (0, 0))
    
    # 2. Bullets
    b_player = create_bullet(False)
    sheet.paste(b_player, (70, 16))
    
    b_enemy = create_bullet(True)
    sheet.paste(b_enemy, (100, 22))
    
    # Laser
    laser = create_laser()
    sheet.paste(laser, (130, 0))

    # 3. Powerups
    p_up = create_powerup('upgrade')
    p_str = create_powerup('strengthen')
    p_light = create_powerup('lightning')
    
    y_pow = 70
    sheet.paste(p_up, (0, y_pow))
    sheet.paste(p_str, (50, y_pow))
    sheet.paste(p_light, (100, y_pow))
    
    # 4. Enemies
    colors = ['#F56C6C', '#E6A23C', '#67C23A', '#409EFF', '#909399', '#8E44AD']
    y_enemy = 120
    for i in range(6):
        en = create_enemy(colors[i], i)
        sheet.paste(en, (i * 70, y_enemy))
        
    # 5. Lightning VFX
    l_vfx = create_lightning_vfx()
    sheet.paste(l_vfx, (0, 200))
    
    # 6. Big Enemy (Placed to the right of Lightning)
    big_enemy = create_big_enemy()
    sheet.paste(big_enemy, (100, 200))
    
    # 7. Explosion
    y_exp = 460
    for i in range(8):
        exp = create_explosion(i)
        sheet.paste(exp, (i * 64, y_exp))
        
    # Save Sprite Sheet
    sheet_path = os.path.join(ASSETS_DIR, 'spritesheet.png')
    sheet.save(sheet_path)
    print(f"Generated spritesheet at {sheet_path}")
    
    # Save Background
    bg = create_background()
    bg_path = os.path.join(ASSETS_DIR, 'background.png')
    bg.save(bg_path)
    print(f"Generated background at {bg_path}")

if __name__ == '__main__':
    main()
