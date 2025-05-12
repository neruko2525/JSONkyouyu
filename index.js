require('dotenv').config();
const fs = require('fs');
const { Client } = require('@notionhq/client');

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const databaseId = process.env.NOTION_DATABASE_ID;

const raw = fs.readFileSync('./character.json', 'utf8');
const json = JSON.parse(raw);
const char = json.data;

// ステータス・パラメータのマッピング
const statusMap = Object.fromEntries(char.status.map(s => [s.label, s.value]));
const paramMap = Object.fromEntries(char.params.map(p => [p.label, parseInt(p.value)]));

// memoから年齢・職業・性別を抽出
const memo = char.memo || '';
const ageMatch = memo.match(/\((\d{1,3})\)/);
const age = ageMatch ? parseInt(ageMatch[1]) : null;
const jobGenderMatch = memo.match(/\)\s*([\p{L}ー・\w\s]+?)\s+(男性|女性)/u);
const job = jobGenderMatch ? jobGenderMatch[1].trim() : '';
const gender = jobGenderMatch ? jobGenderMatch[2] : '';

// Notionに送信
async function sendToNotion(data) {
  try {
    await notion.pages.create({
      parent: { database_id: databaseId },
      properties: {
        名前: { title: [{ text: { content: data.name } }] },
        年齢: { number: age },
        職業: { rich_text: [{ text: { content: job } }] },
        性別: { rich_text: [{ text: { content: gender } }] },
        HP: { number: statusMap.HP },
        MP: { number: statusMap.MP },
        SAN: { number: statusMap.SAN },
        STR: { number: paramMap.STR },
        CON: { number: paramMap.CON },
        POW: { number: paramMap.POW },
        DEX: { number: paramMap.DEX },
        APP: { number: paramMap.APP },
        SIZ: { number: paramMap.SIZ },
        INT: { number: paramMap.INT },
        EDU: { number: paramMap.EDU },
        チャットパレット: { rich_text: [{ text: { content: data.commands } }] }
      }
    });
    console.log('✅ Notionに送信成功');
  } catch (err) {
    console.error('❌ Notion送信失敗:', err.message);
  }
}

sendToNotion(char);
