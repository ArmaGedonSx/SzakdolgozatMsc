import * as fs from 'fs';
import * as path from 'path';

interface Color {
    r: number;
    g: number;
    b: number;
    a: number;
}

class PixelArtGradientGenerator {
    private width: number;
    private height: number;

    constructor(width: number, height: number) {
        this.width = width;
        this.height = height;
    }

    private createPNGHeader(): Buffer {
        const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
        return signature;
    }

    private createIHDRChunk(): Buffer {
        const data = Buffer.alloc(13);
        data.writeUInt32BE(this.width, 0);
        data.writeUInt32BE(this.height, 4);
        data.writeUInt8(8, 8); // bit depth
        data.writeUInt8(6, 9); // color type (RGBA)
        data.writeUInt8(0, 10); // compression
        data.writeUInt8(0, 11); // filter
        data.writeUInt8(0, 12); // interlace

        return this.createChunk('IHDR', data);
    }

    private createChunk(type: string, data: Buffer): Buffer {
        const length = Buffer.alloc(4);
        length.writeUInt32BE(data.length, 0);

        const typeBuffer = Buffer.from(type, 'ascii');
        const crc = this.crc32(Buffer.concat([typeBuffer, data]));
        const crcBuffer = Buffer.alloc(4);
        crcBuffer.writeUInt32BE(crc, 0);

        return Buffer.concat([length, typeBuffer, data, crcBuffer]);
    }

    private crc32(buffer: Buffer): number {
        let crc = 0xffffffff;
        for (let i = 0; i < buffer.length; i++) {
            crc ^= buffer[i];
            for (let j = 0; j < 8; j++) {
                crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
            }
        }
        return (crc ^ 0xffffffff) >>> 0;
    }

    private createIDATChunk(pixels: Color[][]): Buffer {
        const scanlines: Buffer[] = [];

        for (let y = 0; y < this.height; y++) {
            const scanline = Buffer.alloc(1 + this.width * 4);
            scanline.writeUInt8(0, 0); // filter type: none

            for (let x = 0; x < this.width; x++) {
                const pixel = pixels[y][x];
                const offset = 1 + x * 4;
                scanline.writeUInt8(pixel.r, offset);
                scanline.writeUInt8(pixel.g, offset + 1);
                scanline.writeUInt8(pixel.b, offset + 2);
                scanline.writeUInt8(pixel.a, offset + 3);
            }
            scanlines.push(scanline);
        }

        const uncompressed = Buffer.concat(scanlines);
        const compressed = this.deflate(uncompressed);

        return this.createChunk('IDAT', compressed);
    }

    private deflate(data: Buffer): Buffer {
        // Simple DEFLATE implementation for uncompressed blocks
        const blocks: Buffer[] = [];
        let offset = 0;

        while (offset < data.length) {
            const blockSize = Math.min(65535, data.length - offset);
            const isLast = offset + blockSize >= data.length ? 1 : 0;

            const header = Buffer.alloc(5);
            header.writeUInt8(isLast, 0);
            header.writeUInt16LE(blockSize, 1);
            header.writeUInt16LE((~blockSize >>> 0) & 0xffff, 3);

            blocks.push(header);
            blocks.push(data.slice(offset, offset + blockSize));
            offset += blockSize;
        }

        // Add zlib header
        const zlibHeader = Buffer.from([0x78, 0x01]);
        const zlibData = Buffer.concat(blocks);

        // Calculate Adler-32 checksum
        const adler = this.adler32(data);
        const adlerBuffer = Buffer.alloc(4);
        adlerBuffer.writeUInt32BE(adler >>> 0, 0);

        return Buffer.concat([zlibHeader, zlibData, adlerBuffer]);
    }

    private adler32(buffer: Buffer): number {
        let a = 1;
        let b = 0;

        for (let i = 0; i < buffer.length; i++) {
            a = (a + buffer[i]) % 65521;
            b = (b + a) % 65521;
        }

        return (b << 16) | a;
    }

    private createIENDChunk(): Buffer {
        return this.createChunk('IEND', Buffer.alloc(0));
    }

    private lerp(start: number, end: number, t: number): number {
        return Math.round(start + (end - start) * t);
    }

    private lerpColor(color1: Color, color2: Color, t: number): Color {
        return {
            r: this.lerp(color1.r, color2.r, t),
            g: this.lerp(color1.g, color2.g, t),
            b: this.lerp(color1.b, color2.b, t),
            a: this.lerp(color1.a, color2.a, t),
        };
    }

    private smoothstep(t: number): number {
        return t * t * (3 - 2 * t);
    }

    private noise(x: number, y: number, seed: number = 0): number {
        const n = Math.sin(x * 12.9898 + y * 78.233 + seed) * 43758.5453;
        return n - Math.floor(n);
    }

    public generateLavaBackground(): Buffer {
        const pixels: Color[][] = [];
        
        // Lava/Fire color palette
        const colors = {
            darkRed: { r: 40, g: 0, b: 0, a: 255 },
            deepRed: { r: 100, g: 0, b: 0, a: 255 },
            red: { r: 200, g: 20, b: 0, a: 255 },
            orange: { r: 255, g: 100, b: 0, a: 255 },
            brightOrange: { r: 255, g: 150, b: 0, a: 255 },
            yellow: { r: 255, g: 200, b: 0, a: 255 },
            brightYellow: { r: 255, g: 240, b: 100, a: 255 },
            white: { r: 255, g: 255, b: 220, a: 255 },
        };

        for (let y = 0; y < this.height; y++) {
            const row: Color[] = [];
            const t = y / (this.height - 1);
            const smoothT = this.smoothstep(t);

            for (let x = 0; x < this.width; x++) {
                // Multi-color lava gradient: dark red -> red -> orange -> yellow -> white
                let color: Color;
                
                if (smoothT < 0.2) {
                    // Dark red to Deep red
                    const localT = smoothT / 0.2;
                    color = this.lerpColor(colors.darkRed, colors.deepRed, localT);
                } else if (smoothT < 0.4) {
                    // Deep red to Red
                    const localT = (smoothT - 0.2) / 0.2;
                    color = this.lerpColor(colors.deepRed, colors.red, localT);
                } else if (smoothT < 0.6) {
                    // Red to Orange
                    const localT = (smoothT - 0.4) / 0.2;
                    color = this.lerpColor(colors.red, colors.orange, localT);
                } else if (smoothT < 0.8) {
                    // Orange to Yellow
                    const localT = (smoothT - 0.6) / 0.2;
                    color = this.lerpColor(colors.orange, colors.yellow, localT);
                } else {
                    // Yellow to White
                    const localT = (smoothT - 0.8) / 0.2;
                    color = this.lerpColor(colors.yellow, colors.white, localT);
                }

                // Add flowing lava texture with multiple noise layers
                const flowNoise1 = this.noise(x * 0.03, y * 0.03 + x * 0.01, 42);
                const flowNoise2 = this.noise(x * 0.08, y * 0.08, 123);
                const combinedNoise = (flowNoise1 * 0.7 + flowNoise2 * 0.3);
                const noiseStrength = 25;
                
                color.r = Math.max(0, Math.min(255, color.r + (combinedNoise - 0.5) * noiseStrength));
                color.g = Math.max(0, Math.min(255, color.g + (combinedNoise - 0.5) * noiseStrength * 0.8));
                color.b = Math.max(0, Math.min(255, color.b + (combinedNoise - 0.5) * noiseStrength * 0.3));

                // Add bright lava veins
                const veinNoise = this.noise(x * 0.15, y * 0.15, 456);
                if (veinNoise > 0.75) {
                    const veinIntensity = (veinNoise - 0.75) / 0.25;
                    const veinColor = this.lerpColor(colors.orange, colors.brightYellow, veinIntensity);
                    color = this.lerpColor(color, veinColor, veinIntensity * 0.6);
                }

                // Add hot sparks/embers
                const sparkNoise = this.noise(x * 0.4, y * 0.4, 789);
                if (sparkNoise > 0.97) {
                    const sparkBrightness = (sparkNoise - 0.97) / 0.03;
                    if (sparkBrightness > 0.5) {
                        color = { r: 255, g: 255, b: 200, a: 255 }; // Bright white spark
                    } else {
                        color = { r: 255, g: 180, b: 0, a: 255 }; // Orange spark
                    }
                }

                // Add darker cracks/cooled areas
                const crackNoise = this.noise(x * 0.25, y * 0.25, 999);
                if (crackNoise < 0.15) {
                    const darkening = (0.15 - crackNoise) / 0.15;
                    color.r = Math.floor(color.r * (1 - darkening * 0.7));
                    color.g = Math.floor(color.g * (1 - darkening * 0.8));
                    color.b = Math.floor(color.b * (1 - darkening * 0.9));
                }

                row.push(color);
            }
            pixels.push(row);
        }

        return this.createPNG(pixels);
    }

    public generateFantasyBackground(): Buffer {
        const pixels: Color[][] = [];
        
        // Fantasy color palette
        const colors = {
            deepPurple: { r: 75, g: 0, b: 130, a: 255 },
            purple: { r: 138, g: 43, b: 226, a: 255 },
            magenta: { r: 199, g: 21, b: 133, a: 255 },
            pink: { r: 255, g: 105, b: 180, a: 255 },
            cyan: { r: 64, g: 224, b: 208, a: 255 },
            lightCyan: { r: 127, g: 255, b: 212, a: 255 },
        };

        for (let y = 0; y < this.height; y++) {
            const row: Color[] = [];
            const t = y / (this.height - 1);
            const smoothT = this.smoothstep(t);

            for (let x = 0; x < this.width; x++) {
                // Multi-color gradient: cyan -> purple -> magenta -> pink
                let color: Color;
                
                if (smoothT < 0.33) {
                    // Cyan to Purple
                    const localT = smoothT / 0.33;
                    color = this.lerpColor(colors.lightCyan, colors.purple, localT);
                } else if (smoothT < 0.66) {
                    // Purple to Magenta
                    const localT = (smoothT - 0.33) / 0.33;
                    color = this.lerpColor(colors.purple, colors.magenta, localT);
                } else {
                    // Magenta to Pink
                    const localT = (smoothT - 0.66) / 0.34;
                    color = this.lerpColor(colors.magenta, colors.pink, localT);
                }

                // Add noise for texture
                const noiseValue = this.noise(x * 0.05, y * 0.05, 42);
                const noiseStrength = 15;
                color.r = Math.max(0, Math.min(255, color.r + (noiseValue - 0.5) * noiseStrength));
                color.g = Math.max(0, Math.min(255, color.g + (noiseValue - 0.5) * noiseStrength));
                color.b = Math.max(0, Math.min(255, color.b + (noiseValue - 0.5) * noiseStrength));

                // Add stars
                const starNoise = this.noise(x * 0.3, y * 0.3, 123);
                if (starNoise > 0.98) {
                    const brightness = Math.floor((starNoise - 0.98) / 0.02 * 255);
                    color = { r: 255, g: 255, b: 255, a: brightness };
                }

                // Add magical particles (colored sparkles)
                const particleNoise = this.noise(x * 0.2, y * 0.2, 456);
                if (particleNoise > 0.985) {
                    const hue = this.noise(x, y, 789);
                    if (hue < 0.33) {
                        color = { r: 255, g: 200, b: 255, a: 255 }; // Pink sparkle
                    } else if (hue < 0.66) {
                        color = { r: 200, g: 255, b: 255, a: 255 }; // Cyan sparkle
                    } else {
                        color = { r: 255, g: 255, b: 200, a: 255 }; // Yellow sparkle
                    }
                }

                row.push(color);
            }
            pixels.push(row);
        }

        return this.createPNG(pixels);
    }

    public generateVerticalGradient(topColor: Color, bottomColor: Color, dithering: boolean = false): Buffer {
        const pixels: Color[][] = [];

        for (let y = 0; y < this.height; y++) {
            const row: Color[] = [];
            const t = y / (this.height - 1);

            for (let x = 0; x < this.width; x++) {
                let color = this.lerpColor(topColor, bottomColor, t);

                // Apply dithering for pixel art effect
                if (dithering) {
                    const ditherPattern = ((x % 2) + (y % 2)) % 2;
                    const ditherStrength = 0.1;
                    if (ditherPattern === 1) {
                        color.r = Math.min(255, Math.round(color.r * (1 + ditherStrength)));
                        color.g = Math.min(255, Math.round(color.g * (1 + ditherStrength)));
                        color.b = Math.min(255, Math.round(color.b * (1 + ditherStrength)));
                    }
                }

                row.push(color);
            }
            pixels.push(row);
        }

        return this.createPNG(pixels);
    }

    public generateSolidColor(color: Color): Buffer {
        const pixels: Color[][] = [];

        for (let y = 0; y < this.height; y++) {
            const row: Color[] = [];
            for (let x = 0; x < this.width; x++) {
                row.push({ ...color });
            }
            pixels.push(row);
        }

        return this.createPNG(pixels);
    }

    private createPNG(pixels: Color[][]): Buffer {
        const chunks = [
            this.createPNGHeader(),
            this.createIHDRChunk(),
            this.createIDATChunk(pixels),
            this.createIENDChunk(),
        ];

        return Buffer.concat(chunks);
    }
}

// Fantasy color palette
const colors = {
    deepPurple: { r: 75, g: 0, b: 130, a: 255 },
    purple: { r: 138, g: 43, b: 226, a: 255 },
    magenta: { r: 199, g: 21, b: 133, a: 255 },
    pink: { r: 255, g: 105, b: 180, a: 255 },
    hotPink: { r: 255, g: 20, b: 147, a: 255 },
    cyan: { r: 64, g: 224, b: 208, a: 255 },
    lightCyan: { r: 127, g: 255, b: 212, a: 255 },
    darkPurple: { r: 50, g: 0, b: 80, a: 255 },
    transparent: { r: 0, g: 0, b: 0, a: 0 },
};

function generateMenuBackgrounds(): void {
    const outputDir = path.join(__dirname, '..', 'assets', 'Media', 'Images', 'Menu');

    // Create output directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    console.log('🔥 Generating lava-themed menu backgrounds...\n');

    // 1. Main background - Lava gradient with flowing texture
    const bgGenerator = new PixelArtGradientGenerator(700, 1000);
    const mainBg = bgGenerator.generateLavaBackground();
    fs.writeFileSync(path.join(outputDir, 'menu-background.png'), mainBg);
    console.log('✅ Generated: menu-background.png (700x1000) - Lava gradient with embers');

    // 2. Purple-Pink gradient overlay
    const redGradientGen = new PixelArtGradientGenerator(700, 960);
    const redGradient = redGradientGen.generateVerticalGradient(
        { ...colors.purple, a: 200 },
        { ...colors.magenta, a: 150 },
        true // with dithering
    );
    fs.writeFileSync(path.join(outputDir, 'menu-gradient-red.png'), redGradient);
    console.log('✅ Generated: menu-gradient-red.png (700x960) - Purple to Magenta');

    // 3. Top gradient - Purple to semi-transparent
    const topGradientGen = new PixelArtGradientGenerator(700, 300);
    const topGradient = topGradientGen.generateVerticalGradient(
        { ...colors.deepPurple, a: 255 },
        { ...colors.purple, a: 100 },
        true
    );
    fs.writeFileSync(path.join(outputDir, 'menu-gradient-top.png'), topGradient);
    console.log('✅ Generated: menu-gradient-top.png (700x300) - Deep purple fade');

    // 4. Bottom gradient - Pink to dark purple
    const bottomGradientGen = new PixelArtGradientGenerator(700, 143);
    const bottomGradient = bottomGradientGen.generateVerticalGradient(
        { ...colors.pink, a: 80 },
        { ...colors.darkPurple, a: 255 },
        true
    );
    fs.writeFileSync(path.join(outputDir, 'menu-gradient-bottom.png'), bottomGradient);
    console.log('✅ Generated: menu-gradient-bottom.png (700x143) - Pink to dark purple');

    console.log('\n🎉 All fantasy backgrounds generated successfully!');
    console.log(`📁 Output directory: ${outputDir}`);
    console.log('\n✨ Fantasy theme features:');
    console.log('   - Multi-color gradient (Cyan → Purple → Magenta → Pink)');
    console.log('   - Sparkling stars');
    console.log('   - Magical colored particles');
    console.log('   - Pixel art texture with noise');
}

// Run the generator
generateMenuBackgrounds();
