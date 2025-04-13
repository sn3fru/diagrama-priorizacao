// netlify/functions/save-data.js
// Usa node-fetch v2 (CommonJS) - instale com 'npm install node-fetch@2' ou 'yarn add node-fetch@2'
const fetch = require('node-fetch');

// SUBSTITUA PELA URL REAL DO SEU APPS SCRIPT
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbz7I1Mh_5hvJrHzFJfsf4Cz0zq4v_07MIqbVN0CHaqzEFiejH64px3LukAIUuNJvN1OAA/exec";

exports.handler = async (event, context) => {
    // Permite apenas requisições POST
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        // 1. Recebe os dados enviados pelo JavaScript do navegador
        // Espera receber: { id: "...", impact: ..., difficulty: ... }
        const payload = JSON.parse(event.body);

        // Validação básica do payload recebido
        if (!payload || !payload.id || payload.impact == null || payload.difficulty == null) {
            return { statusCode: 400, body: JSON.stringify({ error: 'Payload inválido. Esperado id, impact, difficulty.' }) };
        }

        // 2. Prepara os dados para enviar ao Apps Script no formato que ele espera (x-www-form-urlencoded)
        //    (Mantendo a última versão do Apps Script doPost que esperava parâmetros)
        const formData = new URLSearchParams();
        formData.append('id', payload.id);
        formData.append('impact', payload.impact);
        formData.append('difficulty', payload.difficulty);
        // Adicione outros campos se o Apps Script doPost for modificado para recebê-los

        // 3. Chama o Google Apps Script (Servidor para Servidor - sem CORS do navegador)
        const response = await fetch(APPS_SCRIPT_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formData.toString(), // Envia como string codificada
            redirect: 'follow' // Segue redirecionamentos se houver
        });

        // 4. Verifica a resposta do Apps Script
        if (!response.ok) {
            // Tenta pegar o texto do erro do Apps Script se falhar
            const errorText = await response.text();
            console.error("Erro do Apps Script:", errorText);
            throw new Error(`Falha ao chamar Apps Script: ${response.status} ${response.statusText} - ${errorText}`);
        }

        // 5. Processa a resposta JSON do Apps Script
        const result = await response.json();

        // 6. Retorna a resposta do Apps Script para o JavaScript do navegador
        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": "*", // Permite resposta para qualquer origem (Netlify)
                "Access-Control-Allow-Headers": "Content-Type",
                "Content-Type": "application/json" // Garante que a resposta da function seja JSON
            },
            body: JSON.stringify(result) // Retorna o { success: true/false, ... } do Apps Script
        };

    } catch (error) {
        console.error("Erro na Netlify Function:", error);
        return {
            statusCode: 500,
            headers: { // Importante incluir headers CORS no erro também
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "Content-Type",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ error: 'Erro interno na função Netlify.', details: error.message })
        };
    }
};