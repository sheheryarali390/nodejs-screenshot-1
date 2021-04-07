
const chromium = require('chrome-aws-lambda');
const aws = require('aws-sdk');
const ejs = require('ejs');
const fs = require('fs');
// const nodemailer = require('nodemailer');

const ses = new aws.SES({
    region: 'us-east-1'
 });

exports.handler = async (event, context, callback) => {

  try {
    const buffer = await takeScreenshot(event.url);
    //const file = await generateTemplate(buffer);

    await send_raw_email(buffer);
    // await sendEmail("This is test subject","<p>This email contails attachment</p>",event.recipientEmail,
    //   { 
    //     filename: "attachment.html", 
    //     content: file 
    //   }
    // );
  
    return { success: true }; 
  }
  catch(e) {
    return callback(e);
  }
 
};

async function generateTemplate(img_base64) {
  const params =  {
    imgsrc : 'data:image/png;base64, ' + img_base64
  };
  const html = await ejs.renderFile('/opt/template.ejs',params);
  return html;
}



async function takeScreenshot(url) {
  let browser = await chromium.puppeteer.launch({
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    executablePath: await chromium.executablePath,
    headless: true,
    ignoreHTTPSErrors: true,
  });

  const page = await browser.newPage();

  await page.setRequestInterception(true);

  page.on('request', request => {
    if (!request.isNavigationRequest()) {
      request.continue();
      return;
    }
    const headers = request.headers();
    headers['Authorization'] = 'raadsakljdnsadkbhsdab';
    request.continue({ headers });
  });

  await page.goto(url);
  await page.waitForSelector('#bodyContent');
  const element = await page.$('#bodyContent');
  
  const screenshot = await element.screenshot({encoding:'base64'});
  await browser.close();

  return screenshot;
}

function send_raw_email(buffer){

  let SOURCE_EMAIL = 'sheheryarali@eurustechnologies.com'
  let toEmail = 'sheheryaralibhatti@gmail.com'
  try {
      var ses_mail = "From: 'AWS SES Attchament Configuration' <" + SOURCE_EMAIL + ">\n";
      ses_mail = ses_mail + "To: " + toEmail + "\n";
      ses_mail = ses_mail + "Subject: AWS SES Attachment Example\n";
      ses_mail = ses_mail + "MIME-Version: 1.0\n";
      ses_mail = ses_mail + "Content-Type: multipart/mixed; boundary=\"NextPart\"\n\n";
      ses_mail = ses_mail + "--NextPart\n";
      ses_mail = ses_mail + "Content-Type: text/html; charset=us-ascii\n\n";
      ses_mail = ses_mail + "This is the body of the email.\n\n";
      ses_mail = ses_mail + "<p><img src=\"cid:img-x\" /></p>\n\n";      
      ses_mail = ses_mail + "--NextPart\n";
      ses_mail = ses_mail + "Content-Type: image/png;\n";
      ses_mail = ses_mail + "Content-ID: <img-x>\n";
      ses_mail = ses_mail + "Content-Disposition: inline;\n";
      ses_mail = ses_mail + "Content-Transfer-Encoding: base64\n\n";
      ses_mail = ses_mail + buffer;
      ses_mail = ses_mail + "\n\n";
      ses_mail = ses_mail + "--NextPart--";

      var params = {
          RawMessage: { Data: Buffer.from(ses_mail) },
          Destinations: [toEmail],
          Source: "'AWS SES Attchament Configuration' <" + SOURCE_EMAIL + ">'"
      };

      var sendPromise = ses.sendRawEmail(params).promise();

      return sendPromise.then(
          data => {
              return data;
          }).catch(
          err => {
              console.error(err.message);
              throw err;
          });
  } catch (e) {
      console.log('Error:', e.stack);
  }

}