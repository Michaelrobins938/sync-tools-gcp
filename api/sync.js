import { GoogleSpreadsheet } from 'google-spreadsheet';
import dotenv from 'dotenv';
dotenv.config();

const serviceAccountKey = JSON.parse(process.env.SERVICE_ACCOUNT_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { sheet_id, range, mode, data } = req.body;
  if (!sheet_id || !range || !mode) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  try {
    const doc = new GoogleSpreadsheet(sheet_id);
    await doc.useServiceAccountAuth(serviceAccountKey);
    await doc.loadInfo();

    const sheetTitle = range.split('!')[0];
    const sheet = doc.sheetsByTitle[sheetTitle];
    if (!sheet) return res.status(404).json({ error: 'Sheet not found' });

    if (mode === 'read') {
      const rows = await sheet.getRows();
      return res.status(200).json(rows.map(row => row._rawData));
    } else if (mode === 'write') {
      if (!data) return res.status(400).json({ error: 'Data is required for write mode' });
      await sheet.addRows(data);
      return res.status(200).json({ message: 'Data written successfully' });
    } else {
      return res.status(400).json({ error: 'Invalid mode' });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
