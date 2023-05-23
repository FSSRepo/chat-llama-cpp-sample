const express = require('express');
const cors = require('cors')
const http = require('http')
const { Server } = require('socket.io');
const axios = require('axios');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

io.on("connection", (socket) => {
    socket.on("disconnect", (reason) => {
    });
});

let vicuna_mode = {
    instructions: [
        { role: "system", content: "A chat between a curious human and an artificial intelligence assistant. The assistant gives helpful, detailed, and polite answers to the human's questions." },
        { role: "user", content: "Hello, Assistant." },
        { role: "assistant", content: "Hello. How may I help you today?" },
        { role: "user", content: "Please tell me the largest city in Europe." },
        { role: "assistant", content: "Sure. The largest city in Europe is Moscow, the capital of Russia." }
    ],

    build_prompt: () => {
        let prompt = '';
        for(let inst of vicuna_mode.instructions) {
            if(inst.role == "system") {
                prompt += inst.content + '\n\n';
            } else if(inst.role == "user") {
                prompt += '### Human: '  + inst.content + '\n';
            } else if(inst.role == "assistant") {
                prompt += '### Assistant: '  + inst.content + '\n';
            }
        }
        for(let ctx of context) {
            if(ctx.role == "user") {
                prompt += '### Human: '  + ctx.content + '\n';
            } else if(ctx.role == "assistant") {
                prompt += '### Assistant: '  + ctx.content;
            }
        }
        return prompt;
    },
    stop_words: ["### Human:"],
    exclude_words: ["### Assistant:"]
}

let pygmalion_mode = {
    instructions: [
        { role: "system", content: "Assistant's Persona: Assistant is a highly intelligent language model trained to comply with user requests." },
        { role: "user", content: "Hello, Assistant." },
        { role: "assistant", content: "Hello. How may I help you today?" },
        { role: "user", content: "Please tell me the largest city in Europe." },
        { role: "assistant", content: "Sure. The largest city in Europe is Moscow, the capital of Russia." }
    ],

    build_prompt: () => {
        let prompt = "";
        for (let inst of pygmalion_mode.instructions) {
          if (inst.role == "system") {
            prompt += inst.content + "\n\n";
          } else if (inst.role == "user") {
            prompt += "You: " + inst.content + "\n";
          } else if (inst.role == "assistant") {
            prompt += "Assistant: " + inst.content + "\n";
          }
        }
        for (let ctx of context) {
          if (ctx.role == "user") {
            prompt += "You: " + ctx.content + "\n";
          } else if (ctx.role == "assistant") {
            prompt += "Assistant:" + ctx.content;
          }
        }
        prompt += "Assistant:";
        return prompt;
    },
    stop_words: ["You:"],
    exclude_words: []
}

let context = [];

// CHANGE THIS: examples modes vicuna and pygmalion
let model_config = pygmalion_mode; // vicuna_mode

app.use(cors());

app.use(express.json());
app.use(express.static('./public'));

app.post('/send',async (req, res) => {
    let message_result = '';
    context.push({ role: "user", content: req.body.text });
    let result = await axios.post("http://127.0.0.1:8080/completion", {
      prompt: model_config.build_prompt(),
      batch_size: 128,
      temperature: 0.2,
      top_k: 40,
      top_p: 0.9,
      n_keep: -1,
      n_predict: 2048,
      stop: model_config.stop_words, // when detect this, stop completion
      exclude: model_config.exclude_words, // no show in the completion
      threads: 8,
      as_loop: true,
      interactive: true, // default mode is generation
    });
    while (true) {
      let completion = (await axios.get("http://127.0.0.1:8080/next-token"))
        .data;
      io.to(req.body.socket_id).emit(
        "message-stream",
        completion.content
      );
      message_result += completion.content;
      if (completion.stop) {
        io.to(req.body.socket_id).emit("message-stream", "stop-chat");
        context.push({ role: "assistant", content: message_result });
        break;
      }
    }
    res.send({});
});

app.get('/reset',async (req, res) => {
    context = [];
    console.log("Context cleanup");
    res.send({ status: "done" });
});

server.listen(2400, () => {
    console.log("Chat LlaMA is listening");
});