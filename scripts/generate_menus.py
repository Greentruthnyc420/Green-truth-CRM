import matplotlib.pyplot as plt
import pandas as pd
import os

# Ensure output directory exists
OUTPUT_DIR = "../public/menus"
if not os.path.exists(OUTPUT_DIR):
    os.makedirs(OUTPUT_DIR)

def save_menu_image(df, title, filename, col_widths=None):
    """
    Generates a PNG image from a pandas DataFrame.
    """
    # Calculate height based on number of rows to keep it readable
    # Base height of 2 inches + 0.3 inches per row
    row_count = len(df)
    fig_height = max(4, 2 + (row_count * 0.4))
    
    fig, ax = plt.subplots(figsize=(12, fig_height))
    ax.axis('tight')
    ax.axis('off')
    
    # Create the table
    table = ax.table(cellText=df.values,
                     colLabels=df.columns,
                     cellLoc='center',
                     loc='center')
    
    # Formatting
    table.auto_set_font_size(False)
    table.set_fontsize(10)
    table.scale(1, 2)  # Stretch rows for readability
    
    # Style the headers and rows
    for (row, col), cell in table.get_celld().items():
        if row == 0:
            cell.set_text_props(weight='bold', color='white')
            cell.set_facecolor('#333333')  # Dark header
            cell.set_height(0.05)
        else:
            cell.set_facecolor('#f5f5f5' if row % 2 else '#ffffff')  # Alternating row colors
            
    # Add title
    plt.title(title, fontsize=16, weight='bold', pad=20)
    
    # Save
    filepath = os.path.join(OUTPUT_DIR, filename)
    plt.savefig(filepath, bbox_inches='tight', dpi=300)
    plt.close()
    print(f"Generated: {filepath}")

# ==========================================
# 1. HONEY KING DATA
# ==========================================
hk_data = [
    # 2G Disposables
    ["2G Royal Palm All-In-One", "White Widow (Hybrid)", "81.33%", "$34.95"],
    ["2G Royal Palm All-In-One", "Coochie Runts (Hybrid)", "80.20%", "$34.95"],
    ["2G Royal Palm All-In-One", "Royal Highness (Hybrid)", "87.50%", "$34.95"],
    ["2G Royal Palm All-In-One", "Northern Light (Indica)", "83.18%", "$34.95"],
    ["2G Royal Palm All-In-One", "Royal OG (Indica)", "82.17%", "$34.95"],
    ["2G Royal Palm All-In-One", "Green Crack (Sativa)", "81.87%", "$34.95"],
    ["2G Royal Palm All-In-One", "Key Lime Pie (Sativa)", "81.67%", "$34.95"],
    ["2G Royal Palm All-In-One", "Blue Dream (Sativa)", "81.07%", "$34.95"],
    ["2G Royal Palm All-In-One", "Durban Poison (Sativa)", "89.20%", "$34.95"],
    ["2G Royal Palm All-In-One", "Mango Haze (Sativa)", "80.84%", "$34.95"],
    # 1.1G Disposables
    ["1.1G Premium All-In-One", "Gorilla Punch (Hybrid)", "81.50%", "$20.50"],
    ["1.1G Premium All-In-One", "Chemdawg (Hybrid)", "82.33%", "$20.50"],
    ["1.1G Premium All-In-One", "Diablo OG (Indica)", "82.49%", "$20.50"],
    ["1.1G Premium All-In-One", "Alien Cookies (Hybrid)", "90.51%", "$20.50"],
    ["1.1G Premium All-In-One", "Purple Haze (Hybrid)", "89.81%", "$20.50"],
    ["1.1G Premium All-In-One", "Khalifa Kush (Indica)", "88.63%", "$20.50"],
    ["1.1G Premium All-In-One", "King Louis XII (Indica)", "89.73%", "$20.50"],
    ["1.1G Premium All-In-One", "Blue Dream (Sativa)", "86.20%", "$20.50"],
    ["1.1G Premium All-In-One", "Jack Herer (Sativa)", "87.96%", "$20.50"],
    # Sweet Edition
    ["1.1G Sweet Edition", "Coochie Runts (Hybrid)", "80.91%", "$20.50"],
    ["1.1G Sweet Edition", "Jealous Bananas (Hybrid)", "84.67%", "$20.50"],
    ["1.1G Sweet Edition", "Mango Kush (Indica)", "81.26%", "$20.50"],
    ["1.1G Sweet Edition", "Grape Dosi (Sativa)", "84.52%", "$20.50"],
    # Pre-Rolls
    ["1.5G Diamond Infused Pre-Roll", "Cotton Candy (Hybrid)", "33.63%", "$8.60"],
    ["1.5G Diamond Infused Pre-Roll", "Gorilla Glue (Hybrid)", "33.59%", "$8.60"],
    ["1.5G Diamond Infused Pre-Roll", "White Runts (Hybrid)", "35.61%", "$8.60"],
    ["1.5G Diamond Infused Pre-Roll", "Green Crack (Sativa)", "46.56%", "$8.60"],
    ["1.5G Diamond Infused Pre-Roll", "Tangi (Sativa)", "46.52%", "$8.60"],
    # Live Resin
    ["3.5G Live Resin Minis", "OG Blend (Hybrid)", "35.26%", "$22.50"],
    ["3.5G Live Resin Minis", "Papaya Melon (Hybrid)", "37.63%", "$22.50"],
    ["3.5G Live Resin Minis", "Sativa Blend", "37.80%", "$22.50"],
    # Flower
    ["3.5G Indoor Flower", "Runts (Hybrid)", "25.29%", "$20.50"],
    ["3.5G Indoor Flower", "Boof (Hybrid)", "21.88%", "$20.50"],
    ["3.5G Indoor Flower", "Dream (Sativa)", "20.77%", "$20.50"],
]
df_hk = pd.DataFrame(hk_data, columns=["Category", "Strain/Flavor", "THC %", "Unit Price"])

# ==========================================
# 2. SPACE POPPERS DATA
# ==========================================
sp_data = [
    ["Sweet Chili Popcorn", "100mg (Large Bag)", "Sweet caramel & spicy chili", "$14.00 (3+ Cases)\n$12.50 (6+ Cases)"],
    ["Sea Salt Caramel Popcorn", "100mg (Large Bag)", "Rich buttery caramel w/ sea salt", "$14.00 (3+ Cases)\n$12.50 (6+ Cases)"],
    ["Chicago Style Popcorn", "100mg (Large Bag)", "Caramel & sharp cheddar mix", "$14.00 (3+ Cases)\n$12.50 (6+ Cases)"],
]
df_sp = pd.DataFrame(sp_data, columns=["Product", "Potency", "Description", "Pricing Tiers"])

# ==========================================
# 3. CANNA DOTS DATA
# ==========================================
cd_data = [
    ["THC Dissolvable - Unflavored", "2.5mg/dot (100mg Unit)", "$14.50", "$290.00", "0.07% THC | 3.79% CBD"],
    ["THC Sublingual - Blueberry", "5mg/dot (100mg Unit)", "$13.50", "$270.00", "0.14% THC | 7.17% CBD"],
    ["THC Sublingual - Cherry", "5mg/dot (100mg Unit)", "$13.50", "$270.00", "0.16% THC | 7.91% CBD"],
    ["THC Sublingual - Orange", "5mg/dot (100mg Unit)", "$13.50", "$270.00", "0.16% THC | 7.36% CBD"],
]
df_cd = pd.DataFrame(cd_data, columns=["Variant", "Dosage", "Unit Price", "Case Price (20ct)", "Cannabinoids"])

# ==========================================
# 4. WANDERS NEW YORK DATA
# ==========================================
wn_data = [
    ["Croutons", "3.5g Wander Bread Water Hash", "$65.00", "10"],
    ["Slice of Bread", "3.5g Wander Bread Piff Flower", "$18.00", "32"],
    ["Baguette (Low THC)", "1g Preroll – Anginetti", "$3.00", "50"],
    ["Baguette (High THC)", "1g Preroll – Mocha Afghani", "$6.00", "50"],
    ["Vape AIO", ".5g Cream Puff Live Resin Butter", "$18.00", "20"],
]
df_wn = pd.DataFrame(wn_data, columns=["Product", "Description", "Unit Price", "Case Size"])

# ==========================================
# GENERATE IMAGES
# ==========================================
if __name__ == "__main__":
    save_menu_image(df_hk, "Honey King Pricing & Order Guide", "Honey_King_Menu.png")
    save_menu_image(df_sp, "Space Poppers Menu", "Space_Poppers_Menu.png")
    save_menu_image(df_cd, "Canna Dots Price List", "Canna_Dots_Menu.png")
    save_menu_image(df_wn, "Wanders New York Menu", "Wanders_Menu.png")
