use anchor_lang::prelude::*;
use instructions::*;

pub mod state;
pub mod instructions;
pub mod constants;
pub mod errors;

declare_id!("D1XHmse2CeLU1hcoNhFeVzVsqcspLUqavv2CZPP6bWBF");

#[program]
pub mod twitter {
    use super::*;
    pub fn send_tweet(ctx: Context<SendTweet>, topic: String, content: String) -> Result<()> {
        instructions::send_tweet::send_tweet(ctx, topic, content)
    }
}