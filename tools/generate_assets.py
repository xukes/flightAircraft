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
    
    # Blue Jet Style (Nose UP)
    c_main = '#409EFF'
    c_dark = '#2b85e4'
    c_highlight = '#66b1ff'
    c_glass = '#00ffff'
    
    # Wings (Swept Back)
    draw.polygon([(32, 20), (0, 50), (10, 55), (32, 40)], fill=c_main, outline=c_dark) # Left
    draw.polygon([(32, 20), (64, 50), (54, 55), (32, 40)], fill=c_main, outline=c_dark) # Right
    
    # Rear Stabilizers
    draw.polygon([(32, 45), (15, 60), (25, 60), (32, 50)], fill=c_dark) # Left
    draw.polygon([(32, 45), (49, 60), (39, 60), (32, 50)], fill=c_dark) # Right
    
    # Fuselage Body
    draw.ellipse([(24, 5), (40, 60)], fill=c_main, outline=c_dark)
    
    # Cockpit Glass
    draw.ellipse([(28, 15), (36, 35)], fill=c_glass, outline='#00aaaa')
    # Cockpit Glint
    draw.line([(30, 20), (30, 25)], fill='white', width=2)
    
    # Engine Vents
    draw.rectangle([(26, 40), (28, 50)], fill='#111')
    draw.rectangle([(36, 40), (38, 50)], fill='#111')
    
    # Engine Flame
    draw.polygon([(28, 60), (36, 60), (32, 64)], fill='#ff9900')
    draw.polygon([(30, 60), (34, 60), (32, 63)], fill='#ffff00')
    
    return img

def create_enemy(color, type_idx):
    img = Image.new('RGBA', (64, 64), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Enemies face DOWN (Nose at y=64)
    style = type_idx % 4
    
    if style == 0: # Green Bomber Style (Twin Engine)
        c_main = '#67C23A' # Green
        c_dark = '#3e7523'
        c_detail = '#254d15'
        
        # Main Wings
        draw.polygon([(32, 20), (4, 30), (4, 45), (32, 40)], fill=c_main, outline=c_dark) # Left
        draw.polygon([(32, 20), (60, 30), (60, 45), (32, 40)], fill=c_main, outline=c_dark) # Right
        
        # Fuselage
        draw.rectangle([(26, 5), (38, 60)], fill=c_main, outline=c_dark)
        
        # Engines on wings
        draw.ellipse([(10, 25), (20, 45)], fill=c_dark, outline=c_detail)
        draw.ellipse([(44, 25), (54, 45)], fill=c_dark, outline=c_detail)
        
        # Cockpit
        draw.rectangle([(28, 45), (36, 55)], fill='#ff0000', outline='#550000')
        
        # Tail
        draw.polygon([(26, 5), (15, 0), (49, 0), (38, 5)], fill=c_dark)

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
        draw.polygon([(22, 25), (0, 35), (0, 45), (22, 40)], fill=c_main, outline=c_dark)
        draw.polygon([(42, 25), (64, 35), (64, 45), (42, 40)], fill=c_main, outline=c_dark)
        
        # Front Engines
        draw.rectangle([(20, 50), (28, 60)], fill=c_metal, outline='black')
        draw.rectangle([(36, 50), (44, 60)], fill=c_metal, outline='black')
        
        # Cockpit (wide)
        draw.rectangle([(24, 40), (40, 48)], fill='#ff0000', outline='#550000')
        
        # Tail
        draw.polygon([(32, 10), (15, 0), (49, 0)], fill=c_dark)

    elif style == 3: # Blue Jet (Enemy version)
        c_main = '#409EFF'
        c_dark = '#2b85e4'
        
        # Wings (Swept Forward for enemy look)
        draw.polygon([(32, 30), (6, 10), (16, 5), (32, 20)], fill=c_main, outline=c_dark)
        draw.polygon([(32, 30), (58, 10), (48, 5), (32, 20)], fill=c_main, outline=c_dark)
        
        # Fuselage
        draw.polygon([(32, 64), (24, 40), (24, 10), (32, 0), (40, 10), (40, 40)], fill=c_main, outline=c_dark)
        
        # Cockpit
        draw.ellipse([(28, 45), (36, 55)], fill='#ff0000', outline='#550000')
        
        # Tail
        draw.polygon([(32, 10), (20, 0), (44, 0)], fill=c_dark)

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

def main():
    # Create Sprite Sheet Canvas
    # Layout:
    # Row 1: Player (64x64) | Bullet P (16x32) | Bullet E (20x20)
    # Row 2: Powerups (3x 40x40)
    # Row 3: Enemies (6x 64x64)
    # Row 4: Lightning VFX (64x256)
    # Row 5: Explosion (8x 64x64)
    
    sheet_w = 64 * 8 # Increased to fit 8 explosion frames
    sheet_h = 64 + 40 + 64 + 20 + 260 + 80 # Added space for explosion
    
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
    
    # 6. Explosion
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
