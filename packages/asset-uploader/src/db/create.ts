import { type Location, prisma, Project } from "@webstudio-is/prisma-client";
import sharp from "sharp";
import { getAssetPath } from "../helpers/get-asset-path";

export const create = async (
  projectId: Project["id"],
  values: {
    name: string;
    size: number;
    metadata: sharp.Metadata;
    location: Location;
  }
) => {
  const size = values.size || values.metadata.size || 0;
  const { metadata, name, location } = values;
  const newAsset = await prisma.asset.create({
    data: {
      location,
      name,
      size,
      format: metadata.format,
      ...(metadata.width ? { width: metadata.width } : {}),
      ...(metadata.height ? { height: metadata.height } : {}),
      projectId,
    },
  });

  return {
    ...newAsset,
    path: getAssetPath(newAsset),
  };
};
