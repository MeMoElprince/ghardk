const nodemailer = require('nodemailer');
const pug = require('pug');
const htmlToText = require('html-to-text');

module.exports = class Email {
    constructor(user, url) {
        this.to = user.email;
        this.firstName = user.first_name;
        this.url = url;
        this.from = 'Ghrdk <Gharadk Team>';
    }

    newTransport() {
        if(process.env.NODE_ENV === 'production'){
            // Sendgrid
            return nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.EMAIL_USERNAME,
                    pass: process.env.EMAIL_PASSWORD
                }
            });
        }

        return nodemailer.createTransport({
            host: process.env.EMAIL_HOST_DEV,
            port: process.env.EMAIL_PORT_DEV,
            auth: {
                user: process.env.EMAIL_USERNAME_DEV,
                pass: process.env.EMAIL_PASSWORD_DEV
            }
        });
    }

    async send(template, subject) {
        // 1) Render HTML based on a pug template
        const html = pug.renderFile(`${__dirname}/../views/email/${template}.pug`, {
            firstName: this.firstName,
            url: this.url,
            subject
        });

        // 2) Define email options
        const mailOptions = {
            from: this.from,
            to: this.to,
            subject,
            html,
            text: htmlToText.convert(html)
        };

        // 3) Create a transport and send email
        await this.newTransport().sendMail(mailOptions);
    }

    async verifyAccount() {
        await this.send('verifyAccount', 'Email Verification needed');
    }
}