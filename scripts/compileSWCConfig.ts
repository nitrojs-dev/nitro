import swcConfig from "../swc.config";

async function generateConfig() {
    const start = performance.now();
    
    try {
        const json = JSON.stringify(swcConfig, null, 4);
        
        // Using Bun's high-speed writer
        const bytes = await Bun.write(".swcrc", json);
        const end = performance.now();
        const calc = end - start;
        const rounded = Math.round(calc);
        // Calculate and round up to the nearest whole millisecond
        const ms = rounded.toString() === "0" ? "less than 1" : rounded.toString(); 
        console.log(`✅ SWC config compiled successfully in ${ms}ms (exactly ${calc.toFixed(4)}ms).`);
        console.log(`ℹ️ ${bytes} bytes were written to '.swcrc'.`)
    } catch (err: any) {
        console.error("❌ Error writing .swcrc: ", err);
    }
}

await generateConfig();