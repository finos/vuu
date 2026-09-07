import fs from "fs";
import path from "path";

export async function copyLicense(licencePath: string, outdir: string) {
  return fs.copyFile(
    path.resolve(licencePath),
    path.resolve(outdir, "LICENSE"),
    (err) => {
      if (err) {
        console.log("error copying LICENSE", { err });
      }
    },
  );
}
