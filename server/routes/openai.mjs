import express from 'express';
import OpenAI from "openai";
import fs from "fs";
import bodyParser from "body-parser";

const openai = new OpenAI({
    apiKey: "YOUR_KEY_GOES_HERE",
});

// Create application/x-www-form-urlencoded parser
const urlencodedParser = bodyParser.urlencoded()

const router = express.Router();

router.get('/text/:text', async (req, res) => {
    console.log("text generation...");

    const response = await openai.responses.create({
        model: "gpt-4o-mini",
        input: req.params["text"] || "Write a one-sentence bedtime story about a unicorn.",
    });

    console.log(response.output_text);
    res.send(response.output_text);
});

router.post('/text', async (req, res) => {
    const response = await openai.responses.create({
        model: "gpt-4o-mini",
        input: req.body.text || "Write a one-sentence bedtime story about a unicorn.",
    });

    console.log(response.output_text);
    res.send(response.output_text);
});

router.post('/image', urlencodedParser, async (req, res) => {
    if (req.body) {
        if (req.body.text) {
            console.log(req.body.text);
        }
        console.log("text generation...");
        const response = await openai.responses.create({
            model: "gpt-4o-mini",
            input: [{
                role: "user",
                content: [
                    { type: "input_text", text: req.body.text || "what's in this image?" },
                    {
                        type: "input_image",
                        image_url: req.body.image || "https://upload.wikimedia.org/wikipedia/commons/6/62/A-Frame_Hello_World_example.png",
                    },
                ],
            }],
        });

        console.log(response.output_text);
        return res.send(response.output_text);
    } else {
        return res.status(400).json({ error: 'image url required' });
    }
});

router.post('/image_gen', urlencodedParser, async (req, res) => {
    if (req.body) {
        const prompt = req.body.text || "what's in this image?";
        if (prompt) {
            console.log(prompt);
        }
        console.log("image generation...");
        const response = await openai.responses.create({
            model: "gpt-4o-mini",
            input: [{
                role: "user",
                content: [
                    { type: "input_text", text: prompt },
                    {
                        type: "input_image",
                        image_url: req.body.image || "https://upload.wikimedia.org/wikipedia/commons/6/62/A-Frame_Hello_World_example.png",
                    },
                ],
            }],
            tools: [{ type: "image_generation" }],
        });

        const imageData = response.output
            .filter((output) => output.type === "image_generation_call")
            .map((output) => output.result);

        if (imageData.length > 0) {
            const imageBase64 = imageData[0];
            const rnd = (Math.random() + 1).toString(36).substring(7);
            const path = `img/output-${rnd}.png`;
            fs.writeFileSync(`public/${path}`, Buffer.from(imageBase64, "base64"));

            fs.appendFileSync('public/img/output.txt', `${path}=${prompt}\n`);

            console.log("image generated");
            return res.send(path);
        } else {
            console.log("Output:", response.output.content);
        }
    } else {
        return res.status(400).json({ error: 'image url required' });
    }
});

export default router;