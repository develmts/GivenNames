// join json semantic seeds in onefiled
import fs from "fs";
import path from "path";  

const jsonPath = path.resolve(process.cwd(), "data/semantic");
const outfile = path.resolve(process.cwd(), "data/raw/curated_seeds.json");
const outJson = path.resolve(process.cwd(), "data/raw/joined_clusters.json");
const outshort = path.resolve(process.cwd(), "data/raw/curated_short.json");

const dryrun = false

// a small helper func
function aRnd(arr:any[], howmany:number=1) {
  const aRes= []
  for (let i=0 ; i < howmany; i++){
    aRes.push(arr[Math.floor(Math.random() * arr.length)])
  }
  return aRes
}

function importJson(filePath:string): any{
  let cluster  : any = {}
  try {
    const raw = fs.readFileSync(filePath, {encoding:"utf-8"});
    cluster = JSON.parse(raw)
  } catch (err:any) {
    console.error(`[joiner] Error reading/parsing ${filePath}: ${err.message}`);
    return {};
  } 
  return cluster;
}

function saveDict(data: Record<string,any>){
  if(!data) 
    return;
  console.log(data)
  const objSize= Object.keys(data).length
  fs.writeFileSync(outJson, JSON.stringify(data, null, 2), {encoding:"utf-8"});
  console.log(`[joiner] Written ${objSize} clusters to ${outJson}`);

  // get a rtandom selection of 10 names for short file
  // const shortList = aRnd(obj.seeds,10).sort()

  // let shortObj = {
  //   seeds: shortList.sort()
  // }
  // fs.writeFileSync(outshort, JSON.stringify(shortObj, null, 2), {encoding:"utf-8"});
  // console.log(`[joiner] Written ${shortList.length} names to ${outshort}`);

}


function jsonDict(){
  console.log(`[joiner] Reading .json files from ${jsonPath}`);
  console.log(`[joiner] Output file: ${outJson}`);

  const inFiles = fs.readdirSync(jsonPath).filter(f => f.endsWith(".json"));

  if (inFiles.length === 0) {
    console.warn("[joiner] No .json files found in", jsonPath);
    return;
  }
  let crudeDict : Record<string,any> = {}
  for (const file of inFiles) {
    const filePath = path.join(jsonPath, file);
    const newObj:any = importJson(filePath);
    if(!newObj ){
      console.warn(`[joiner] No names found in ${filePath}`);
      continue;
    }
    console.log("Parsing:", newObj.cluster, newObj.examples.length)
    crudeDict[newObj.cluster]=newObj.examples.sort();
  }
  const dictSize = Object.keys(crudeDict).length
  console.log(`Basic length ${dictSize}`)
  if (dictSize > 0) {
    if (!dryrun)
      saveDict(crudeDict)
  } 
}


function importFile(filePath:string): string[]{
  let seeds  : string[] = []
  try {
    const raw = fs.readFileSync(filePath, {encoding:"utf-8"});
    seeds = JSON.parse(raw).examples
  } catch (err:any) {
    console.error(`[joiner] Error reading/parsing ${filePath}: ${err.message}`);
    return [];
  } 
  return seeds;
}

function saveResult(data: Set<string>){
  if(data.size===0) 
    return;

  let obj = {
    seeds: [...data].sort()
  }
  fs.writeFileSync(outfile, JSON.stringify(obj, null, 2), {encoding:"utf-8"});
  console.log(`[joiner] Written ${data.size} names to ${outfile}`);

  // get a rtandom selection of 10 names for short file
  const shortList = aRnd(obj.seeds,10).sort()

  let shortObj = {
    seeds: shortList.sort()
  }
  fs.writeFileSync(outshort, JSON.stringify(shortObj, null, 2), {encoding:"utf-8"});
  console.log(`[joiner] Written ${shortList.length} names to ${outshort}`);

}

function main(){
  console.log(`[joiner] Reading .json files from ${jsonPath}`);
  console.log(`[joiner] Output file: ${outfile}`);

  const inFiles = fs.readdirSync(jsonPath).filter(f => f.endsWith(".json"));

  if (inFiles.length === 0) {
    console.warn("[joiner] No .json files found in", jsonPath);
    return;
  }
  let crudeList : string[] = []
  for (const file of inFiles) {
    const filePath = path.join(jsonPath, file);
    const newList= importFile(filePath);
    if(newList.length===0){
      console.warn(`[joiner] No names found in ${filePath}`);
      continue;
    }
    crudeList.push(...newList);
  }
  console.log(`Basic length ${crudeList.length}`)
  const curated = new Set(crudeList)
  console.log(`Curated length ${curated.size}`)
  if (curated.size > 0) {
    if (!dryrun)
      saveResult(curated)
  } 
}

// main()
jsonDict()