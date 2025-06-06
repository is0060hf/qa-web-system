// メール送信サービスのインターフェース
interface EmailService {
  sendEmail(params: EmailParams): Promise<void>;
}

// メール送信パラメータ
interface EmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

// メールテンプレート
export const emailTemplates = {
  // パスワードリセットメール
  passwordReset: (resetUrl: string) => ({
    subject: 'パスワードリセットのご案内',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>パスワードリセットのご案内</h2>
        <p>パスワードリセットのリクエストを受け付けました。</p>
        <p>以下のリンクをクリックして、新しいパスワードを設定してください：</p>
        <p style="margin: 20px 0;">
          <a href="${resetUrl}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
            パスワードをリセット
          </a>
        </p>
        <p>このリンクは1時間有効です。</p>
        <p>心当たりがない場合は、このメールを無視してください。</p>
      </div>
    `,
    text: `
パスワードリセットのご案内

パスワードリセットのリクエストを受け付けました。
以下のリンクをクリックして、新しいパスワードを設定してください：

${resetUrl}

このリンクは1時間有効です。
心当たりがない場合は、このメールを無視してください。
    `.trim()
  }),

  // プロジェクト招待メール
  projectInvitation: (inviterName: string, projectName: string, invitationUrl: string) => ({
    subject: `${projectName}への招待`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>${projectName}への招待</h2>
        <p>${inviterName}さんから、プロジェクト「${projectName}」への参加招待が届いています。</p>
        <p>以下のリンクをクリックして、招待を受け入れてください：</p>
        <p style="margin: 20px 0;">
          <a href="${invitationUrl}" style="background-color: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
            招待を受け入れる
          </a>
        </p>
        <p>このリンクは7日間有効です。</p>
      </div>
    `,
    text: `
${projectName}への招待

${inviterName}さんから、プロジェクト「${projectName}」への参加招待が届いています。
以下のリンクをクリックして、招待を受け入れてください：

${invitationUrl}

このリンクは7日間有効です。
    `.trim()
  }),

  // 新しい質問の通知メール
  newQuestionAssigned: (assignerName: string, questionTitle: string, questionUrl: string) => ({
    subject: '新しい質問が割り当てられました',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>新しい質問が割り当てられました</h2>
        <p>${assignerName}さんから新しい質問が割り当てられました。</p>
        <p><strong>質問タイトル：</strong>${questionTitle}</p>
        <p style="margin: 20px 0;">
          <a href="${questionUrl}" style="background-color: #17a2b8; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
            質問を確認する
          </a>
        </p>
      </div>
    `,
    text: `
新しい質問が割り当てられました

${assignerName}さんから新しい質問が割り当てられました。
質問タイトル：${questionTitle}

質問を確認する：${questionUrl}
    `.trim()
  }),

  // 回答通知メール
  newAnswerPosted: (answererName: string, questionTitle: string, answerUrl: string) => ({
    subject: '質問に回答が投稿されました',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>質問に回答が投稿されました</h2>
        <p>${answererName}さんがあなたの質問に回答しました。</p>
        <p><strong>質問タイトル：</strong>${questionTitle}</p>
        <p style="margin: 20px 0;">
          <a href="${answerUrl}" style="background-color: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
            回答を確認する
          </a>
        </p>
      </div>
    `,
    text: `
質問に回答が投稿されました

${answererName}さんがあなたの質問に回答しました。
質問タイトル：${questionTitle}

回答を確認する：${answerUrl}
    `.trim()
  }),

  // 期限超過通知メール
  deadlineExceeded: (questionTitle: string, questionUrl: string, isAssignee: boolean) => ({
    subject: `質問の期限が超過しました${isAssignee ? '（回答者）' : '（質問者）'}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>質問の期限が超過しました</h2>
        <p>${isAssignee ? '担当している質問' : 'あなたが作成した質問'}の期限が超過しました。</p>
        <p><strong>質問タイトル：</strong>${questionTitle}</p>
        <p style="margin: 20px 0;">
          <a href="${questionUrl}" style="background-color: #dc3545; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
            質問を確認する
          </a>
        </p>
      </div>
    `,
    text: `
質問の期限が超過しました

${isAssignee ? '担当している質問' : 'あなたが作成した質問'}の期限が超過しました。
質問タイトル：${questionTitle}

質問を確認する：${questionUrl}
    `.trim()
  })
};

// ダミーのメール送信サービス（開発環境用）
class DummyEmailService implements EmailService {
  async sendEmail(params: EmailParams): Promise<void> {
    console.log('=== メール送信（ダミー） ===');
    console.log('宛先:', params.to);
    console.log('件名:', params.subject);
    console.log('本文（HTML）:', params.html);
    if (params.text) {
      console.log('本文（テキスト）:', params.text);
    }
    console.log('========================');
  }
}

// SendGridを使用したメール送信サービス（本番環境用）
// 注: @sendgrid/mailパッケージのインストールが必要
class SendGridEmailService implements EmailService {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async sendEmail(params: EmailParams): Promise<void> {
    // TODO: SendGrid APIを使用してメールを送信
    // const sgMail = require('@sendgrid/mail');
    // sgMail.setApiKey(this.apiKey);
    // await sgMail.send({
    //   to: params.to,
    //   from: process.env.EMAIL_FROM || 'noreply@example.com',
    //   subject: params.subject,
    //   html: params.html,
    //   text: params.text,
    // });
    throw new Error('SendGridメール送信は未実装です');
  }
}

// AWS SESを使用したメール送信サービス（本番環境用）
// 注: @aws-sdk/client-sesパッケージのインストールが必要
class AWSSESEmailService implements EmailService {
  async sendEmail(params: EmailParams): Promise<void> {
    // TODO: AWS SES APIを使用してメールを送信
    // const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');
    // const client = new SESClient({ region: process.env.AWS_REGION });
    // const command = new SendEmailCommand({
    //   Source: process.env.EMAIL_FROM || 'noreply@example.com',
    //   Destination: { ToAddresses: [params.to] },
    //   Message: {
    //     Subject: { Data: params.subject },
    //     Body: {
    //       Html: { Data: params.html },
    //       Text: params.text ? { Data: params.text } : undefined,
    //     },
    //   },
    // });
    // await client.send(command);
    throw new Error('AWS SESメール送信は未実装です');
  }
}

// メール送信サービスのファクトリー
function createEmailService(): EmailService {
  const emailProvider = process.env.EMAIL_PROVIDER;

  switch (emailProvider) {
    case 'sendgrid':
      const sendgridApiKey = process.env.SENDGRID_API_KEY;
      if (!sendgridApiKey) {
        throw new Error('SENDGRID_API_KEYが設定されていません');
      }
      return new SendGridEmailService(sendgridApiKey);
    
    case 'aws-ses':
      return new AWSSESEmailService();
    
    case 'dummy':
    default:
      return new DummyEmailService();
  }
}

// シングルトンのメール送信サービス
const emailService = createEmailService();

// メール送信関数
export async function sendEmail(params: EmailParams): Promise<void> {
  try {
    await emailService.sendEmail(params);
  } catch (error) {
    console.error('メール送信エラー:', error);
    // 開発環境ではエラーをログに出力するだけ
    // 本番環境では適切なエラーハンドリングが必要
    if (process.env.NODE_ENV === 'production') {
      throw error;
    }
  }
}

// パスワードリセットメールを送信
export async function sendPasswordResetEmail(email: string, resetUrl: string): Promise<void> {
  const template = emailTemplates.passwordReset(resetUrl);
  await sendEmail({
    to: email,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });
}

// プロジェクト招待メールを送信
export async function sendProjectInvitationEmail(
  email: string,
  inviterName: string,
  projectName: string,
  invitationUrl: string
): Promise<void> {
  const template = emailTemplates.projectInvitation(inviterName, projectName, invitationUrl);
  await sendEmail({
    to: email,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });
}

// 新しい質問の通知メールを送信
export async function sendNewQuestionAssignedEmail(
  email: string,
  assignerName: string,
  questionTitle: string,
  questionUrl: string
): Promise<void> {
  const template = emailTemplates.newQuestionAssigned(assignerName, questionTitle, questionUrl);
  await sendEmail({
    to: email,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });
}

// 回答通知メールを送信
export async function sendNewAnswerPostedEmail(
  email: string,
  answererName: string,
  questionTitle: string,
  answerUrl: string
): Promise<void> {
  const template = emailTemplates.newAnswerPosted(answererName, questionTitle, answerUrl);
  await sendEmail({
    to: email,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });
}

// 期限超過通知メールを送信
export async function sendDeadlineExceededEmail(
  email: string,
  questionTitle: string,
  questionUrl: string,
  isAssignee: boolean
): Promise<void> {
  const template = emailTemplates.deadlineExceeded(questionTitle, questionUrl, isAssignee);
  await sendEmail({
    to: email,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });
} 