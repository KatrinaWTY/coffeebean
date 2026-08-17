const fs = require("fs").promises;
const path = require("path");

const BEANS_PATH = path.join(process.cwd(), "data", "beans.json");
const RETAILERS_PATH = path.join(process.cwd(), "data", "retailers.json");

function generateRetailerId(name) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || `retailer-${Date.now()}`;
}

async function runMigration() {
  console.log("Starting DB Migration...");

  // Read beans
  let beans = [];
  try {
    const raw = await fs.readFile(BEANS_PATH, "utf-8");
    beans = JSON.parse(raw);
  } catch (error) {
    console.error("No beans.json found to migrate!");
    return;
  }

  // Read or initialize retailers
  let retailers = [];
  try {
    const raw = await fs.readFile(RETAILERS_PATH, "utf-8");
    retailers = JSON.parse(raw);
    console.log(`Found ${retailers.length} existing retailers.`);
  } catch (error) {
    console.log("No existing retailers.json. Initializing from beans.json...");
  }

  const existingRetailerNames = new Set(retailers.map(r => r.name.toLowerCase()));

  // Scan roasters
  const roasters = Array.from(new Set(beans.map(b => b.roaster).filter(Boolean)));
  const now = new Date().toISOString();

  let addedRetailersCount = 0;
  for (const roaster of roasters) {
    if (!existingRetailerNames.has(roaster.toLowerCase())) {
      const id = generateRetailerId(roaster);
      retailers.push({
        id,
        name: roaster,
        url: "",
        createdAt: now,
        updatedAt: now
      });
      existingRetailerNames.add(roaster.toLowerCase());
      addedRetailersCount++;
    }
  }

  if (addedRetailersCount > 0) {
    await fs.writeFile(RETAILERS_PATH, JSON.stringify(retailers, null, 2), "utf-8");
    console.log(`Added ${addedRetailersCount} new retailers to data/retailers.json`);
  } else {
    console.log("No new retailers added.");
  }

  // Map beans
  let updatedBeansCount = 0;
  const updatedBeans = beans.map(bean => {
    let changed = false;
    
    // Find retailer ID
    const retailer = retailers.find(r => r.name.toLowerCase() === (bean.roaster || "").toLowerCase());
    const targetRetailerId = retailer ? retailer.id : "";

    if (bean.retailerId === undefined || bean.retailerId !== targetRetailerId) {
      bean.retailerId = targetRetailerId;
      changed = true;
    }

    if (bean.affiliateUrl === undefined) {
      bean.affiliateUrl = "";
      changed = true;
    }

    if (bean.affiliateNetwork === undefined) {
      bean.affiliateNetwork = "";
      changed = true;
    }

    if (bean.merchantId === undefined) {
      bean.merchantId = "";
      changed = true;
    }

    if (changed) {
      updatedBeansCount++;
    }

    return bean;
  });

  if (updatedBeansCount > 0) {
    await fs.writeFile(BEANS_PATH, JSON.stringify(updatedBeans, null, 2), "utf-8");
    console.log(`Updated ${updatedBeansCount} beans with new affiliate/retailer fields.`);
  } else {
    console.log("No coffee beans needed updates.");
  }

  console.log("DB Migration completed successfully!");
}

runMigration().catch(err => {
  console.error("Migration failed:", err);
});
