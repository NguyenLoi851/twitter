use anchor_lang::prelude::*;
use crate::errors::ErrorCode;
use crate::state::twitter::*;

pub fn send_tweet(ctx: Context<SendTweet>, topic: String, content: String) -> Result<()> {
    let tweet: &mut Account<Tweet> = &mut ctx.accounts.tweet;
    let author: &Signer = &ctx.accounts.author;
    let clock: Clock = Clock::get().unwrap();

    if topic.chars().count() > 50 {
        return Err(ErrorCode::TopicTooLong.into())
    }

    if content.chars().count() > 280 {
        return Err(ErrorCode::ContentTooLong.into())
    }

    tweet.author = *author.key;
    tweet.timestamp = clock.unix_timestamp;
    tweet.topic = topic;
    tweet.content = content;
    Ok(())
}

#[derive(Accounts)]
pub struct SendTweet<'info> {
    #[account(init, payer = author, space = Tweet::LEN)]
    pub tweet: Account<'info, Tweet>,
    #[account(mut)]
    pub author: Signer<'info>,
    pub system_program: Program<'info, System>,
}