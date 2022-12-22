use anchor_lang:: prelude::*;
use crate::constants::*;

#[account]
pub struct Tweet {
    pub author: Pubkey,
    pub timestamp: i64,
    pub topic: String,
    pub content: String,
}

impl Tweet {
    pub const LEN: usize = DISCRIMINATOR_LENGTH
        + PUBLIC_KEY_LENGTH
        + TIMESTAMP_LENGTH
        + STRING_LENGTH_PREFIX + MAX_TOPIC_LENGTH
        + STRING_LENGTH_PREFIX + MAX_CONTENT_LENGTH;
}