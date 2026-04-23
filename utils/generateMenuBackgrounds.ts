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

// Color palette - Red and Black theme for pixel art
const colors = {
    black: { r: 0, g: 0, b: 0, a: 255 },
    darkGray: { r: 25, g: 29, b: 43, a: 255 },
    darkRed: { r: 139, g: 0, b: 0, a: 255 },
    red: { r: 178, g: 34, b: 34, a: 255 },
    brightRed: { r: 220, g: 20, b: 60, a: 255 },
    crimson: { r: 158, g: 40, b: 54, a: 255 },
    transparent: { r: 0, g: 0, b: 0, a: 0 },
};

function generateMenuBackgrounds(): void {
    const outputDir = path.join(__dirname, '..', 'assets', 'Media', 'Images', 'Menu');

    // Create output directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    console.log('🎨 Generating pixel art menu backgrounds...\n');

    // 1. Main background - solid dark
    const bgGenerator = new PixelArtGradientGenerator(700, 1000);
    const mainBg = bgGenerator.generateSolidColor(colors.darkGray);
    fs.writeFileSync(path.join(outputDir, 'menu-background.png'), mainBg);
    console.log('✅ Generated: menu-background.png (700x1000)');

    // 2. Red gradient overlay - vertical gradient
    const redGradientGen = new PixelArtGradientGenerator(700, 960);
    const redGradient = redGradientGen.generateVerticalGradient(
        { ...colors.crimson, a: 255 },
        { ...colors.darkRed, a: 200 },
        true // with dithering
    );
    fs.writeFileSync(path.join(outputDir, 'menu-gradient-red.png'), redGradient);
    console.log('✅ Generated: menu-gradient-red.png (700x960)');

    // 3. Top gradient - dark to transparent
    const topGradientGen = new PixelArtGradientGenerator(700, 300);
    const topGradient = topGradientGen.generateVerticalGradient(
        { r: 139, g: 0, b: 0, a: 255 }, // dark red
        { r: 0, g: 0, b: 0, a: 180 }, // semi-transparent black
        true
    );
    fs.writeFileSync(path.join(outputDir, 'menu-gradient-top.png'), topGradient);
    console.log('✅ Generated: menu-gradient-top.png (700x300)');

    // 4. Bottom gradient - transparent to dark
    const bottomGradientGen = new PixelArtGradientGenerator(700, 143);
    const bottomGradient = bottomGradientGen.generateVerticalGradient(
        { r: 0, g: 0, b: 0, a: 100 },
        colors.darkGray,
        true
    );
    fs.writeFileSync(path.join(outputDir, 'menu-gradient-bottom.png'), bottomGradient);
    console.log('✅ Generated: menu-gradient-bottom.png (700x143)');

    console.log('\n🎉 All backgrounds generated successfully!');
    console.log(`📁 Output directory: ${outputDir}`);
}

// Run the generator
generateMenuBackgrounds();
