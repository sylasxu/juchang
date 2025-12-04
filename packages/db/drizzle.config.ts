import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";
dotenv.config({
  path: "../../.env",
});

export default defineConfig({
  schema: './src/schema/*',
  out: './drizzle',
  dialect: 'postgresql', 
  tablesFilter: ["!geography_columns", "!geometry_columns", "!spatial_ref_sys"],
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  // 包含自定义类型
  verbose: true,
  strict: true,
});