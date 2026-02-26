import csv
import random

filename = "inventory_test.csv"
num_rows = 500  # adjust as needed

catalog = {
    "Electronics": [
        "USB Cable", "Power Bank", "Router", "Keyboard", "Mouse", "Smart Plug"
    ],
    "Electrical": [
        "LED Bulb", "Tube Light", "Switch Board", "Extension Cord", "Ceiling Fan"
    ],
    "Accessories": [
        "Laptop Stand", "HDMI Cable", "Surge Protector", "Battery Pack"
    ]
}

with open(filename, "w", newline="") as f:
    writer = csv.writer(f)
    writer.writerow(["item_name", "category", "quantity", "price"])

    for _ in range(num_rows):
        category = random.choice(list(catalog.keys()))
        item_name = random.choice(catalog[category])

        quantity = random.randint(0, 300)

        # category-based pricing realism
        if category == "Electronics":
            price = round(random.uniform(300, 5000), 2)
        elif category == "Electrical":
            price = round(random.uniform(50, 3000), 2)
        else:
            price = round(random.uniform(200, 4000), 2)

        writer.writerow([item_name, category, quantity, price])

print(f"{filename} generated.")