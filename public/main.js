class Main {
  constructor() {
    this.socket = io();
    this.new_chat = false;
    this.current_span = 0;
  }

  async send() {
    if(!$("#chat-text").val() || $("#btnSend").hasClass('disabled-btn')) {
      return;
    }
    $("#btnSend").addClass('disabled-btn');
    this.new_chat = true;
    $("#conversation").append(`<div class="user-burble">
    <span>${$("#chat-text").val()}</span>
  </div><div class="assistant-burble">
  <span id="action-${this.current_span}" class="action-text">Waiting response...</span><br>
  <span id="msg-${this.current_span}" style="white-space: pre-line;"></span>
    </div>`);
    let text = $("#chat-text").val();
    $("#chat-text").val("");
    let res = await post("send", {
      text,
      socket_id: this.socket.id
    });
  }

  async initialize() {
    const ctx = this;
    const toast_driver = new bootstrap.Toast(document.getElementById("reset-toast"), { autohide: true, delay: 4000 });
    $("#btnSend").addClass('disabled-btn');
    $("#chat-text").keyup((evt) => {
      if(!$("#chat-text").val()) {
        $("#btnSend").addClass('disabled-btn');
        return;
      } else {
        $("#btnSend").removeClass('disabled-btn');
      }
      if (evt.keyCode === 13) {
        this.send();
      }
    })

    $("#btnSend").click(async () => {
      this.send();
    });

    $("#btnReset").click(async () => {
      let result = await get("reset");
      $("#conversation").empty();
      $("#chat-text").val("").trigger("change");
      toast_driver.show();
    });

    ctx.socket.on("message-stream", async (msg) => {
      if(ctx.new_chat && msg) {
        $(`#action-${this.current_span}`).text('Writing ...');
        ctx.new_chat = false;
      }
      if(msg === 'stop-chat') {
        $("#btnSend").removeClass('disabled-btn');
        $(`#action-${this.current_span}`).text('Terminated :)');
        setTimeout(() => {
          $(`#action-${this.current_span}`).text('Assistant:');
          this.current_span++;
        }, 2000);
        return;
      }
      $(`#msg-${this.current_span}`).append(msg);
      window.scrollTo(0, document.body.scrollHeight);
    });

    ctx.socket.on("disconnect", async (msg) => {
      console.error("Unexpected connection closed.");
    });
  }
}

$(document).ready(async function () {
  var main = new Main();
  await main.initialize();
});