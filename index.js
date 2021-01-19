const Discord = require('discord.js');
const discordClient = new Discord.Client();
const config = {
    token: process.env.token,
    mongouri: process.env.mongouri
}
const fs = require('fs');
const article = fs.readFileSync("README.md").toString();

const mongoose = require('mongoose')

const connectionParams={
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true 
}
mongoose.connect(config.mongouri,connectionParams)
.then( () => {
    console.log('Connected to database ');
})
.catch( (err) => {
    console.error(`Error connecting to the database. \n${err}`);
});

discordClient.on('ready', () => {
  console.log(`Logged in as ${discordClient.user.tag}!`);
});

const CommandSchema = new mongoose.Schema({
    command: String,
    link: String,
});
const Command = mongoose.model("command", CommandSchema);

discordClient.on('message', msg => {
    const prefix = '>';
    const commands = msg.content.split(' ');
    const filterCommands = ['help'];
    if(commands[0][0] !== prefix){
        return;
    }

    if(commands.length === 1){
        if(commands[0] === prefix+'help'){
            msg.channel.send("\`\`\`"+article+"\`\`\`");
            return;
        }
        const command = commands[0].substr(1);
        let filtered = false;
        filterCommands.forEach((element)=>{
            if(element === command){
                filtered = true;
            }
        });
        if(filtered){
            msg.channel.send('예약어는 사용할 수 없습니다.');
            return;
        }
        Command.findOne({command: command}, (err, data)=>{
            if(err){
                console.log(err);
            }else{
                if(data === null){
                    console.log('nothing');
                }else{
                    msg.channel.send(data.link);
                    //msg.channel.send({ files: [ data.link ] });
                }
            }
        });
        return;
    }
    if(commands.length === 2){
        const filtered = false;
        const command = commands[0].substr(1);
        const link = commands[1];

        if(!command || !link){
            msg.channel.send('인수가 부족합니다.');
            return;
        }
        
        filterCommands.forEach((element)=>{
            if(prefix+element === command){
                filtered = true;
            }
        });
        if(filtered){
            msg.channel.send('이미 있는 명령어입니다.');
            return;
        }

        Command.findOne({command: command}, (err, data)=>{
            if(err){
                console.log(err);
            }else{
                if(data === null){
                    const newCommand = new Command({
                        command: command,
                        link: link,
                    });
                    newCommand.save()
                    .then((data) => {
                        msg.channel.send('등록 성공');
                        console.log(data);
                    })
                    .catch((err) => {
                        msg.channel.send('등록 실패');
                        console.error(err);
                    });
                }else{
                    Command.updateOne({command: command}, {$set: { link: link }})
                    .then((data) => {
                        msg.channel.send('수정 성공');
                        console.log(data);
                    })
                    .catch((err) => {
                        msg.channel.send('수정 실패');
                        console.error(err);
                    });
                }
            }
        });
        return;
    }
});

discordClient.on("error", () => { console.log("error"); });

discordClient.login(config.token);