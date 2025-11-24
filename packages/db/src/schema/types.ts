// packages/db/src/customTypes/vector.ts
import { customType } from "drizzle-orm/pg-core";

/** 与官方未来 vector 类型保持同签名：vector(dim) */
export const vector = <D extends number>(dim: D) =>
  customType<{
    data: number[];
    driverData: string;
    notNull: true;
    default: false;
  }>({
    dataType() {
      return `vector(${dim})`;
    },
    toDriver(val) {
      return `{${val.join(",")}}`;
    },
    fromDriver(value) {
      return value.replace(/[{}]/g, "").split(",").map(Number);
    },
  });

export type GeometryType = "point" | "linestring" | "polygon" | "multipoint";

export const geometry = <T extends GeometryType>(type: T, srid = 4326) =>
  customType<{
    data: string;
    driverData: string;
    notNull: false;
    default: false;
  }>({
    dataType: () => `geometry(${type}, ${srid})`,
    toDriver: (wkt: string) => `ST_GeomFromText('${wkt}', ${srid})`,
    fromDriver: () => {
      throw new Error("Use ST_AsGeoJSON in query");
    },
  });

/** ← 写在这里：让 IDE 知道返回的是普通列构造器，支持 .notNull()/.default() */
export interface GeometryColumn<T extends GeometryType = GeometryType>
  extends ReturnType<typeof geometry<T>> {}
