const {
	Function,
	addAudioMetaData,
	isUrl,
	getBuffer,
	prefix,
	getString,
	isPublic,
	ytIdRegex,
	getJson,
	sendwithLinkpreview,
	toAudio,
	h2k
} = require('../lib/');
const { downloadYouTubeVideo, downloadYouTubeAudio, mixAudioAndVideo, combineYouTubeVideoAndAudio, getYoutubeThumbnail, video, bytesToSize } = require('../lib/youtubei.js');
const { yta, ytv, filterLinks, searchYouTube, getThumb } = require('../lib/y2mate');
const yts = require("yt-search")
const config = require('../config');
const Lang = getString('scrapers');
const fs = require('fs');
const t = "```";

const send = async (message, file, id) => config.SONG_THUMBNAIL ? await sendwithLinkpreview(message.client, message, file,  'https://www.youtube.com/watch?v=' + id) : await message.client.sendMessage(message.chat, { audio: file, mimetype: 'audio/mpeg' }, { quoted: message.data });

Function({
  on: 'text',
  fromMe: isPublic,
}, async (message, match, client) => {
  if (!message.reply_message.isBaileys) return;
  if (!(message.reply_message && message.reply_message.text)) return;
  const text = message.reply_message.text;
  const index = message.text;
  const ytRegex = /(?:https?:\/\/)?(?:youtu\.be\/|(?:www\.|m\.)?youtube\.com\/(?:watch|v|embed|shorts)(?:\.php)?(?:\?.*v=|\/))([a-zA-Z0-9\_-]+)/gi
  if (text.includes('Search results') && text.includes('Format: audio')) {
  const urls = message.reply_message.text.match(ytRegex);
  if (!urls) return await message.send('*The replied message does not contain any YouTube search results.*');
  if (isNaN(index) || index < 1 || index > urls.length) return await message.send('*Invalid index.*\n_Please provide a number within the range of search results._');
  let ytId = ytIdRegex.exec(urls[index - 1]);
  try {
  const media = await downloadYouTubeAudio(ytId[1]);
  if (media.content_length >= 10485760) return await send(message, await fs.readFileSync(media.file), ytId[1]);
  const writer = await addAudioMetaData(await toAudio(await fs.readFileSync(media.file), 'mp4'), media.thumb, media.title, `hermit-md`, 'Hermit Official');
  return await send(message, writer, ytId[1]);
  } catch {
  const response = await getJson('https://api.adithyan.xyz/ytaudio?id=' + ytId[1]);
  if (!response.status) return await message.send('*Failed to download*');
  if (response.content_length >= 10485760) return await client.sendMessage(message.jid, { audio: {url: response.result }, mimetype: 'audio/mpeg', ptt: false }, { quoted: message.data });
  const buffer = await getBuffer(response.result);
  await fs.writeFileSync('./' + response.file, buffer);
  const writer = await addAudioMetaData(await toAudio(await fs.readFileSync('./' + response.file), 'mp4'), response.thumb, response.title, `hermit-md`, 'Hermit Official');
  return await send(message, writer, ytId[1]);
  }
  } else if (text.includes('Search results') && text.includes('Format: video')) {
  const urls = message.reply_message.text.match(ytRegex);
  if (!urls) return await message.send('*The replied message does not contain any YouTube search results.*');
  if (isNaN(index) || index < 1 || index > urls.length) return await message.send('*Invalid index.*\n_Please provide a number within the range of search results._');
  let id = ytIdRegex.exec(urls[index - 1]);
  try {
  const result = await video(id[1]);
  if (!result) return await message.reply('_Failed to download_');
  return await message.send(result.file, 'video', { quoted: message.data, caption: result.title });
  } catch (error) {
  await message.send('```' + error.message + '```')
  }
  } else if (text.includes('Available quality')) {
  const id = text.match(/\*id:\s(.*?)\*/m)[1].trim();
  const qualityMatches = Array.from(text.matchAll(/(\d+)\.\s(.*?)\s-\s([\d.]+)?\s?(\w{1,2})?/mg));
  const qualityOptions = qualityMatches.map(match => ({
    quality: match[2]
  }));  
  if (isNaN(index) || index < 1 || index > qualityOptions.length) return await message.send('*Invalid number.*\n_Please provide a valid number from the available options._');
  const { quality } = qualityOptions[index - 1]
  const result = await getVideo('https://youtu.be/' + id, quality);
  if (!result) return await message.reply('_Failed to download_');
  return await message.send(result.url, 'video', { quoted: message.data, caption: result.title });
  } else if (/\*⬡ ID :\* (\w+)/.test(text)) {
  const id = text.match(/\*⬡ ID :\* ([\w-]+)/);
  if (!id) return;
  if (isNaN(index) || index < 1 || index > 2) return
  if (index == '2') {
  const result = await video(id[1]);
  return await message.send(result.file, 'video', { quoted: message.data, caption: result.title });
  } else if (index == '1') {
  try {
  const media = await downloadYouTubeAudio(id[1]);
  if (media.content_length >= 10485760) return await send(message, await fs.readFileSync(media.file), id[1]);
  const writer = await addAudioMetaData(await toAudio(await fs.readFileSync(media.file), 'mp4'), media.thumb, media.title, `hermit-md`, 'Hermit Official');
  return await send(message, writer, id[1]);
  } catch {
  const response = await getJson('https://api.adithyan.xyz/ytaudio?id=' + id[1]);
  if (!response.status) return await message.send('*Failed to download*');
  if (response.content_length >= 10485760) return await client.sendMessage(message.jid, { audio: {url: response.result }, mimetype: 'audio/mpeg', ptt: false }, { quoted: message.data });
  const buffer = await getBuffer(response.result);
  await fs.writeFileSync('./' + response.file, buffer);
  const writer = await addAudioMetaData(await toAudio(await fs.readFileSync('./' + response.file), 'mp4'), response.thumb, response.title, `hermit-md`, 'Hermit Official');
  return await send(message, writer, id[1]);
  }
  }
  } else if (text.includes('the desired ringtone number')) {
  const urls = message.reply_message.text.match(/https?:\/\/btones\.b-cdn\.net\/[^ ]+\.mp3/g);
  if (!urls) return
  if (isNaN(index) || index < 1 || index > urls.length) return await message.send('*Invalid index.*\n_Please provide a number within the range of search results._');
  await message.send(urls[index - 1], 'audio', { quoted: message.data, mimetype: 'audio/mpeg' });
  }
});

Function({
	pattern: 'play ?(.*)',
	fromMe: isPublic,
	desc: 'play youtube audio and video',
	type: 'download'
}, async (message, match, client) => {
match = match || message.reply_message.text
if (!match) return await message.reply('*Need text!*\n_Example: .play astronaut in the ocean_');
const search = await yts(match)
const response = await searchYouTube(search.videos[0].url);
const data = filterLinks(response, { type: 'mp4' });
const mp3 = filterLinks(response, { type: 'mp3' });

const msg = `*${search.videos[0].title}* 

*⬡ Duration :* ${search.videos[0].timestamp}
*⬡ Viewers :* ${h2k(search.videos[0].views)}
*⬡ Author :* ${search.videos[0].author.name}`

data.sort((a, b) => {
  if (a.quality === 'auto') return 1;
  if (b.quality === 'auto') return -1;
  return parseInt(a.quality) - parseInt(b.quality);
});

const buttons = data.map(item => {
  if (item.quality !== 'auto') {
    return {
      type: "button",
      display_text: `${item.quality} - ${item.size}`,
      id: `${prefix}ytv ${search.videos[0].url} q:${item.quality}`
    };
  }
  return null;
}).filter(button => button !== null);

const mp3b = mp3.map(item => {
  return {
    type: "button",
    display_text: `mp3 - ${item.size}`,
    id: `${prefix}yta ${search.videos[0].url}`,
  };
});

const interactiveMessage = {
  title: msg,
  text: "Please select the desired video quality:",
  footer: "hermit-md",
  subtitle: "Subtitle text",
  buttons: [...mp3b, ...buttons],
  image: { url: await getThumb(search.videos[0].videoId) }
};

await client.interactiveMessage(message.jid, interactiveMessage);
// await message.send(await getYoutubeThumbnail(search.videos[0].videoId), 'image', { caption: msg})
})

Function({
  pattern: 'song ?(.*)',
  fromMe: isPublic,
  desc: Lang.SONG_DESC,
  type: 'download'
}, async (message, match, client) => {
  match = match || message.reply_message.text;
  if (!match) return message.reply(Lang.NEED_TEXT_SONG);
  if (isUrl(match) && match.includes('youtu')) {
    let ytId = ytIdRegex.exec(match);
    try {
      const media = await downloadYouTubeAudio(ytId[1]);
      if (media.content_length >= 10485760) return await send(message, await fs.readFileSync(media.file), ytId[1]);
      const thumb = await getBuffer(await getYoutubeThumbnail(ytId[1]));
      const writer = await addAudioMetaData(await toAudio(await fs.readFileSync(media.file)), thumb, media.title, `${config.BOT_INFO.split(";")[0]}`, 'Hermit Official');
      return await send(message, writer, ytId[1]);
    } catch {
      const response = await getJson('https://api.adithyan.xyz/ytaudio?id=' + ytId[1]);
      if (!response.status) return await message.send('*Failed to download*');
      if (response.content_length >= 10485760) return await client.sendMessage(message.jid, { audio: {url: response.result }, mimetype: 'audio/mpeg', ptt: false }, { quoted: message.data });
      const buffer = await getBuffer(response.result);
      await fs.writeFileSync('./' + response.file, buffer);
      const writer = await addAudioMetaData(await toAudio(await fs.readFileSync('./' + response.file), 'mp4'), response.thumb, response.title, `hermit-md`, 'Hermit Official');
      return await send(message, writer, ytId[1]);
    }
  }
  
  const search = await yts(match);
  if (search.all.length < 1) return await message.reply(Lang.NO_RESULT);
  
  const buttons = search.all.filter(result => result.type === 'video').map((result, index) => ({
    type: 'list',
    title: result.title,
    id: `${prefix}song ${result.url}`,
  }));
  
  await client.interactiveMessage(message.jid, {
    title: search.videos[0].title,
    footer: 'hermit-md',
    subtitle: 'hermit-md',
    text: `And ${search.all.length - 1} More Results...`,
    buttons: buttons
  });
});

Function({
	pattern: 'video ?(.*)',
	fromMe: isPublic,
	desc: Lang.VIDEO_DESC,
	type: 'download'
}, async (message, match, client) => {
	match = match || message.reply_message.text
	if (!match) return message.reply('*Need Youtube video url or query*')
	if (isUrl(match) && match.includes('youtu')) {
		const id = ytIdRegex.exec(match)
	 try {
	  const result = await video(id[1]);
	  if (!result) return await message.reply('_Failed to download_');
	  return await message.send(result.file, 'video', { quoted: message.data, caption: result.title });
	  } catch (error) {
	  return await message.send('```' + error.message + '```')
	  }
	}
	const search = await yts(match)
	if (search.all.length < 1) return await message.reply(Lang.NO_RESULT);
	const buttons = search.all.filter(result => result.type === 'video').map((result, index) => ({
    type: 'list',
    title: result.title,
    id: `${prefix}video ${result.url}`,
  }));
  
  await client.interactiveMessage(message.jid, {
    title: search.videos[0].title,
    text: `And ${search.all.length - 1} More Results...`,
    buttons: buttons
  });
});

Function({
    pattern: 'yta ?(.*)',
    fromMe: isPublic,
    desc: 'Download audios from YouTube',
    type: 'download'
}, async (message, match, client) => {
    match = match || message.reply_message.text;
    if (!match) return message.reply('_Need URL or song name!_\n*Example: .yta URL/song name*');
    
    if (isUrl(match) && match.includes('youtu')) {
        const ytId = ytIdRegex.exec(match);
        const result = await yta('https://youtu.be/' + ytId[1]);
        const fileSizeInMB = parseFloat(result.size);
        if (fileSizeInMB > 10) {
            const audioBuffer = await getBuffer(result.url);
            return await message.client.sendMessage(message.jid, { audio: audioBuffer, mimetype: 'audio/mpeg'}, { quoted: message.data });
        } else {
            const thumb = await getBuffer(await getYoutubeThumbnail(ytId[1]));
            const audioBuffer = await getBuffer(result.url);
            const writer = await addAudioMetaData(await toAudio(audioBuffer), thumb, result.title, `${config.BOT_INFO.split(";")[0]}`, 'Hermit Official');
            return await message.client.sendMessage(message.jid, { audio: writer, mimetype: 'audio/mpeg'}, { quoted: message.data });
        }
    } else {
        const search = await yts(match);
        if (search.all.length < 1) return await message.reply('_Not Found_');
        const result = await yta(search.videos[0].url);
        const fileSizeInMB = parseFloat(result.size);
        if (fileSizeInMB > 10) {
            const audioBuffer = await getBuffer(result.url);
            return await message.client.sendMessage(message.jid, { audio: audioBuffer, mimetype: 'audio/mpeg'}, { quoted: message.data });
        } else {
            const thumb = await getBuffer(result.thumb);
            const audioBuffer = await getBuffer(result.url);
            const file = await addAudioMetaData(audioBuffer, thumb, result.title, `${config.BOT_INFO.split(";")[0]}`, 'Hermit Official');
            return await message.client.sendMessage(message.jid, { audio: file, mimetype: 'audio/mpeg'}, { quoted: message.data });
        }
    }
});

Function({
  pattern: 'ytv ?(.*)',
  fromMe: isPublic,
  desc: 'download videos from youtube',
  type: 'download'
}, async (message, match, client) => {
  match = match || message.reply_message.text;
  if (!match) return message.reply('_Need url or video name!_\n*Example: .ytv url/video name*');
  const qualityMatch = match.match(/q:(\d+p)/i);
  let specifiedQuality = null;
  if (qualityMatch) {
    specifiedQuality = qualityMatch[1];
    match = match.replace(/q:\d+p/i, '').trim();
  }
  
  if (isUrl(match) && match.includes('youtu')) {
    const ytId = ytIdRegex.exec(match);
    if (specifiedQuality) {
    const result = await ytv('https://youtu.be/' + ytId[1], specifiedQuality);
    return await message.send(result.url, 'video', { quoted: message.data, caption: result.title });
    }
    const response = await searchYouTube('https://youtu.be/' + ytId[1]);
    const result = filterLinks(response, { type: 'mp4' });
    let buttons = [];
    let no = 1;
    for (let i of result) {
        buttons.push({
          type: "button",
          display_text: `${i.quality} - ${i.size}`,
          id: `${prefix}ytv https://youtu.be/${ytId[1]} q:${i.quality}`
        });
    }
    const interactiveMessage = {
      title: response.title,
      text: `Available quality:`,
      footer: "hermit-md",
      subtitle: "Subtitle text",
      buttons: buttons
    };
    return await client.interactiveMessage(message.jid, interactiveMessage);
  } else {
    const search = await yts(match);
    if (search.all.length < 1) return await message.reply('_Not Found_');
    try {
      let quality = specifiedQuality ? specifiedQuality : 'auto';
      const result = await ytv(search.videos[0].url, quality);
      if (!result) return await message.reply('_Failed to download_');
      return await message.send(result.url, 'video', { quoted: message.data, caption: result.title });
    } catch (error) {
      return await message.send('```' + error.message + '```');
    }
  }
});
