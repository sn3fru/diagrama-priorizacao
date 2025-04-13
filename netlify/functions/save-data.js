// netlify/functions/save-data.js
const fetch = require('node-fetch'); // Use node-fetch v2 ou ajuste para v3 com import se necessário

// SUBSTITUA PELA URL REAL DO SEU APPS SCRIPT
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbz7I1Mh_5hvJrHzFJfsf4Cz0zq4v_07MIqbVN0CHaqzEFiejH64px3LukAIUuNJvN1OAA/exec"; // <-- Certifique-se que esta URL está correta

exports.handler = async (event, context) => {
    // Permite apenas requisições POST
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    console.log("Netlify Function: Recebido event.body:", event.body); // <-- LOG PARA DEBUG

    try {
        // 1. Recebe os dados enviados pelo JavaScript do navegador (espera JSON)
        const payload = JSON.parse(event.body);
        console.log("Netlify Function: Payload parseado:", payload); // <-- LOG PARA DEBUG

        // Validação básica do payload recebido
        if (!payload || !payload.id || payload.impact == null || payload.difficulty == null) {
            console.error("Netlify Function: Payload inválido recebido.");
            return { statusCode: 400, body: JSON.stringify({ error: 'Payload inválido. Esperado id, impact, difficulty.' }) };
        }

        // 2. Chama o Google Apps Script ENVIANDO JSON
        console.log("Netlify Function: Enviando para Apps Script:", APPS_SCRIPT_URL); // <-- LOG PARA DEBUG
        const response = await fetch(APPS_SCRIPT_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json', // Envia como JSON
            },
            body: JSON.stringify(payload), // Envia o payload como string JSON
            redirect: 'follow'
        });
        console.log("Netlify Function: Resposta do Apps Script Status:", response.status); // <-- LOG PARA DEBUG

        // 4. Verifica a resposta do Apps Script
        const responseText = await response.text(); // Lê como texto primeiro para debug
        console.log("Netlify Function: Resposta do Apps Script Texto:", responseText); // <-- LOG PARA DEBUG

        if (!response.ok) {
            console.error("Netlify Function: Erro na resposta do Apps Script:", responseText);
            throw new Error(`Falha ao chamar Apps Script: Status ${response.status} - ${responseText}`);
        }

        // 5. Processa a resposta JSON do Apps Script (se foi OK)
        const result = JSON.parse(responseText); // Faz parse do texto se a resposta foi OK

        // 6. Retorna a resposta para o JavaScript do navegador
        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
            body: JSON.stringify(result)
        };

    } catch (error) {
        console.error("Erro na Netlify Function:", error);
        return {
            statusCode: 500,
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
            body: JSON.stringify({ error: 'Erro interno na função Netlify.', details: error.message })
        };
    }
};