import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { Twitter } from "../target/types/twitter";
import * as assert from "assert";
import * as bs58 from "bs58";

describe("twitter", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.Twitter as Program<Twitter>;

  it('can send a new tweet', async () => {
    // Call the "SendTweet" instruction.
    const tweet = anchor.web3.Keypair.generate();
    await program.methods
    .sendTweet('Love', 'I love you so much')
    .accounts({
      tweet: tweet.publicKey,
      author: program.provider.publicKey,
      systemProgram: anchor.web3.SystemProgram.programId
    })
    .signers([tweet])
    .rpc()

    // Fetch the account details of the created tweet.
    const tweetAccount = await program.account.tweet.fetch(tweet.publicKey);
  	assert.equal(tweetAccount.author.toBase58(), program.provider.publicKey.toBase58())
    assert.equal(tweetAccount.topic, 'Love')
    assert.equal(tweetAccount.content, 'I love you so much')
    assert.ok(tweetAccount.timestamp)
  });

  it('can send a new tweet from a different author', async()=>{
    // Generate another user and airdrop them some SOL.
    const otherUser = anchor.web3.Keypair.generate();
    const signature = await program.provider.connection.requestAirdrop(otherUser.publicKey, 1000000000);
    await program.provider.connection.confirmTransaction(signature);
    
    const tweet = anchor.web3.Keypair.generate()
    await program.methods
    .sendTweet('Crush', 'I miss you so much')
    .accounts({
      tweet: tweet.publicKey,
      author: otherUser.publicKey,
      systemProgram: anchor.web3.SystemProgram.programId
    })
    .signers([tweet, otherUser])
    .rpc()

    const tweetAccount = await program.account.tweet.fetch(tweet.publicKey)

    assert.equal(tweetAccount.author.toBase58(), otherUser.publicKey.toBase58())
    assert.equal(tweetAccount.topic, 'Crush')
    assert.equal(tweetAccount.content, 'I miss you so much')
    assert.ok(tweetAccount.timestamp)    
  })

  it('cannot provide a topic with more than 50 characters', async () => {
    try {
        const tweet = anchor.web3.Keypair.generate();
        const topicWith51Chars = 'x'.repeat(51);
        await program.methods
        .sendTweet(topicWith51Chars, 'Hummus, am I right?')
        .accounts({
          tweet: tweet.publicKey,
          author: program.provider.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([tweet])
        .rpc();
    } catch (error) {
        assert.equal(error.error.errorMessage, 'The provided topic should be 50 characters long maximum.');
        return;
    }

    assert.fail('The instruction should have failed with a 51-character topic.');
  });

  it('can fetch all tweets', async () => {
    const tweetAccounts = await program.account.tweet.all();
    assert.equal(tweetAccounts.length, 2);
  });

  it('can filter tweets by author', async () => {
    const authorPublicKey = program.provider.publicKey
    const tweetAccounts = await program.account.tweet.all([
        {
            memcmp: {
                offset: 8, // Discriminator.
                bytes: authorPublicKey.toBase58(),
            }
        }
    ]);

    assert.equal(tweetAccounts.length, 1);

    assert.ok(tweetAccounts.every(tweetAccount => {
      return tweetAccount.account.author.toBase58() === authorPublicKey.toBase58()
    }))
  });

  it('can filter tweets by topics', async () => {
    const tweetAccounts = await program.account.tweet.all([
        {
            memcmp: {
                offset: 8 + // Discriminator.
                    32 + // Author public key.
                    8 + // Timestamp.
                    4, // Topic string prefix.
                bytes: bs58.encode(Buffer.from('Love')),
            }
        }
    ]);

    assert.equal(tweetAccounts.length, 1);
    assert.ok(tweetAccounts.every(tweetAccount => {
        return tweetAccount.account.topic === 'Love'
    }))
  });  
});
