const Discord = require('discord.js');
const GIFEncoder = require('gifencoder');
const { createCanvas, loadImage, registerFont } = require('canvas');
const fs = require('fs');

function internalParser(text, member, author){
    if (member != null){
        text = text.replace('${member:tag}', member.tag);
        text = text.replace('${member:userid}', member.id);
        text = text.replace('${member:username}', member.username);
    }
    if(author != null){
        text = text.replace('${author:tag}', author.tag);
        text = text.replace('${author:userid}', author.id);
        text = text.replace('${author:username}', author.username);
    }
    return text;
};

module.exports = {
    name: 'fun.hug',
    description: 'modulo de diversion',
    author: 'fapret (Santiago Nicolas Diaz Conde)',
    async execute(message){
        var member = message.mentions.users.first();
        const animations = JSON.parse(fs.readFileSync('./bot_modules/fun/hug/animations.json'));
        const animationsAmount = Object.keys(animations.animation).length;
        const imageIndex = Math.floor(Math.random() * (animationsAmount) + 1) - 1;
        const selectedImage = animations.animation[imageIndex];
        var messageToSend = selectedImage.message;
        if (member == undefined){
            member = message.author;
            messageToSend = selectedImage.selfMessage;
        }
        messageToSend = internalParser(messageToSend, member, message.author);
        const authorAvatarURL = message.author.displayAvatarURL({ format: 'png', size: 1024});
        const authorAvatar = await loadImage(authorAvatarURL);
        const memberAvatarURL = member.displayAvatarURL({ format: 'png', size: 1024});
        const memberAvatar = await loadImage(memberAvatarURL);

        const encoder = new GIFEncoder(parseInt(selectedImage.width), parseInt(selectedImage.height));
        encoder.createReadStream().pipe(fs.createWriteStream('./cache/' + message.id + '.gif'));
        encoder.start();
        if(selectedImage.repeat){
            encoder.setRepeat(0);
        } else {
            encoder.setRepeat(-1); 
        }
        encoder.setDelay(parseInt(selectedImage.frameVelocity));

        const canvas = createCanvas(parseInt(selectedImage.width), parseInt(selectedImage.height));
        const ctx = canvas.getContext('2d');

        const selectedImageFrames = JSON.parse(fs.readFileSync(selectedImage.images + 'animation.json'));

        selectedImageFrames.animations.sort(function(a, b) {
            if(parseInt(a.ID) > parseInt(b.ID)){
                return 1;
            }
            if(parseInt(a.ID) < parseInt(b.ID)){
                return -1;
            }
            return 0;
        });

        for (i = 0; i < selectedImage.frames; i++) {
            var frame = selectedImageFrames.animations[i];
            var background = await loadImage(selectedImage.images + frame.ID + '.png');
            ctx.drawImage(background, 0, 0, selectedImage.width, selectedImage.height);
            ctx.save();
            if(frame.hasOwnProperty("author")){
                ctx.beginPath();
                ctx.arc(parseInt(frame.author.x), parseInt(frame.author.y), parseInt(frame.author.radius), 0, Math.PI * 2, true);
                ctx.closePath();
                ctx.clip();
                ctx.drawImage(authorAvatar, parseInt(frame.author.x) - parseInt(frame.author.radius), parseInt(frame.author.y) - parseInt(frame.author.radius), parseInt(frame.author.radius) * 2, parseInt(frame.author.radius) * 2);    
            }
            ctx.restore();
            ctx.save();
            if(frame.hasOwnProperty("member")){
                ctx.beginPath();
                ctx.arc(parseInt(frame.member.x), parseInt(frame.member.y), parseInt(frame.member.radius), 0, Math.PI * 2, true);
                ctx.closePath();
                ctx.clip();
                ctx.drawImage(memberAvatar, parseInt(frame.member.x) - parseInt(frame.member.radius), parseInt(frame.member.y) - parseInt(frame.member.radius), parseInt(frame.member.radius) * 2, parseInt(frame.member.radius) * 2);    
            }
            ctx.restore();
            encoder.addFrame(ctx);
        }
        encoder.finish();

        const embeed = new Discord.MessageEmbed().setFooter("trymate bot by Fapret");
        const attach = new Discord.MessageAttachment('./cache/' + message.id + '.gif', `animatedhug.gif`);
        embeed.attachFiles(attach);
        embeed.setDescription(messageToSend);
        embeed.setImage(`attachment://animatedhug.gif`);
        await message.channel.send(embeed);
        fs.unlink('./cache/' + message.id + '.gif', (err => {if(err) console.log(err)}));
    }
}