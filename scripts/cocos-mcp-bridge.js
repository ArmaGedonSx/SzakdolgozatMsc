#!/usr/bin/env node

/**
 * Cocos Creator MCP Bridge
 * 
 * Ez a bridge script lehetővé teszi, hogy a Cline (VS Code MCP kliens)
 * kommunikáljon a Cocos Creator MCP szerverrel HTTP-n keresztül.
 * 
 * A script stdio-t használ a Cline-nal való kommunikációhoz,
 * és HTTP kéréseket küld a Cocos Creator MCP szervernek.
 */

const http = require('http');
const readline = require('readline');

// Cocos Creator MCP szerver URL-je a környezeti változóból
const COCOS_URL = process.env.COCOS_CREATOR_URL || 'http://127.0.0.1:3000/mcp';

// Readline interface a stdin/stdout kezelésére
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false
});

// Debug log (csak stderr-re írunk, hogy ne zavarjuk az MCP kommunikációt)
function debugLog(message) {
    if (process.env.DEBUG) {
        console.error(`[Cocos MCP Bridge] ${message}`);
    }
}

// HTTP kérés küldése a Cocos Creator MCP szervernek
function sendToCocos(jsonrpcRequest) {
    return new Promise((resolve, reject) => {
        const url = new URL(COCOS_URL);
        const postData = JSON.stringify(jsonrpcRequest);

        const options = {
            hostname: url.hostname,
            port: url.port || 80,
            path: url.pathname,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        debugLog(`Sending request to Cocos: ${postData}`);

        const req = http.request(options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                try {
                    debugLog(`Received response from Cocos: ${data}`);
                    const response = JSON.parse(data);
                    resolve(response);
                } catch (error) {
                    reject(new Error(`Failed to parse response: ${error.message}`));
                }
            });
        });

        req.on('error', (error) => {
            reject(new Error(`HTTP request failed: ${error.message}`));
        });

        req.write(postData);
        req.end();
    });
}

// MCP üzenet feldolgozása
async function handleMessage(line) {
    try {
        const request = JSON.parse(line);
        debugLog(`Received from Cline: ${line}`);

        // Továbbítjuk a kérést a Cocos Creator MCP szervernek
        const response = await sendToCocos(request);

        // Visszaküldjük a választ a Cline-nak
        console.log(JSON.stringify(response));
    } catch (error) {
        debugLog(`Error handling message: ${error.message}`);
        
        // Hibaválasz küldése
        const errorResponse = {
            jsonrpc: '2.0',
            id: null,
            error: {
                code: -32603,
                message: `Bridge error: ${error.message}`
            }
        };
        console.log(JSON.stringify(errorResponse));
    }
}

// Indítás
debugLog('Cocos Creator MCP Bridge started');
debugLog(`Connecting to: ${COCOS_URL}`);

// Soronként olvassuk a stdin-t és feldolgozzuk az üzeneteket
rl.on('line', (line) => {
    if (line.trim()) {
        handleMessage(line);
    }
});

rl.on('close', () => {
    debugLog('Bridge closed');
    process.exit(0);
});

// Hibakezelés
process.on('uncaughtException', (error) => {
    debugLog(`Uncaught exception: ${error.message}`);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    debugLog(`Unhandled rejection: ${reason}`);
    process.exit(1);
});
