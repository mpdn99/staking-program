import * as anchor from "@coral-xyz/anchor";
import {Program} from "@coral-xyz/anchor";
import {StakingProgram} from "../target/types/staking_program";
import {Connection, Keypair, PublicKey} from "@solana/web3.js";
import {createMint, getOrCreateAssociatedTokenAccount, mintTo} from "@solana/spl-token";

describe("staking-program", () => {
    // Configure the client to use the local cluster.
    const provider = anchor.AnchorProvider.env();
    anchor.setProvider(provider);
    const payer = provider.wallet as anchor.Wallet;
    const connection = new Connection("http://127.0.0.1:8899", "confirmed");
    const mintKeypair = Keypair.fromSecretKey(new Uint8Array(
        [
            234, 100, 233, 26, 200, 236, 217, 128, 122, 143, 91,
            207, 153, 49, 184, 25, 139, 110, 67, 108, 56, 121,
            135, 201, 144, 236, 201, 105, 226, 100, 252, 90, 152,
            159, 144, 23, 122, 91, 244, 218, 24, 88, 63, 59,
            80, 144, 227, 184, 2, 19, 35, 194, 17, 250, 140,
            65, 99, 60, 32, 185, 157, 186, 85, 230
        ]
    ));

    const program = anchor.workspace.StakingProgram as Program<StakingProgram>;

    it("Is initialized!", async () => {

        let [vaultAccount] = PublicKey.findProgramAddressSync(
            [Buffer.from("vault")],
            program.programId
        )
        // Add your test here.
        const tx = await program.methods.initialize()
            .accounts({
                signer: payer.publicKey,
                tokenVaultAccount: vaultAccount,
                mint: mintKeypair.publicKey,
            })
            .rpc();
        console.log("Your transaction signature", tx);
    });

    it("stake", async () => {
        let userTokenAccount = await getOrCreateAssociatedTokenAccount(
            connection,
            payer.payer,
            mintKeypair.publicKey,
            payer.publicKey,
        )

        await mintTo(
            connection,
            payer.payer,
            mintKeypair.publicKey,
            userTokenAccount.address,
            payer.payer,
            1e11
        )

        let [stakeInfo] = PublicKey.findProgramAddressSync(
            [Buffer.from("stake_info"), payer.publicKey.toBuffer()],
            program.programId
        )

        let [stakeAccount] = PublicKey.findProgramAddressSync(
            [Buffer.from("token"), payer.publicKey.toBuffer()],
            program.programId
        )

        const tx = await program.methods
            .stake(new anchor.BN(1))
            .signers([payer.payer])
            .accounts({
                stakeInfoAccount: stakeInfo,
                stakeAccount: stakeAccount,
                userTokenAccount: userTokenAccount.address,
                mint: mintKeypair.publicKey,
                signer: payer.publicKey,
            })
            .rpc();
        console.log("Your transaction signature", tx);
    });

    it("destake", async () => {
        let userTokenAccount = await getOrCreateAssociatedTokenAccount(
            connection,
            payer.payer,
            mintKeypair.publicKey,
            payer.publicKey,
        )

        let [stakeInfo] = PublicKey.findProgramAddressSync(
            [Buffer.from("stake_info"), payer.publicKey.toBuffer()],
            program.programId
        )

        let [stakeAccount] = PublicKey.findProgramAddressSync(
            [Buffer.from("token"), payer.publicKey.toBuffer()],
            program.programId
        )

        let [vaultAccount] = PublicKey.findProgramAddressSync(
            [Buffer.from("vault")],
            program.programId
        )

        await mintTo(
            connection,
            payer.payer,
            mintKeypair.publicKey,
            vaultAccount,
            payer.payer,
            1e21
        )

        const tx = await program.methods
            .destake()
            .signers([payer.payer])
            .accounts({
                stakeInfoAccount: stakeInfo,
                stakeAccount: stakeAccount,
                userTokenAccount: userTokenAccount.address,
                tokenVaultAccount: vaultAccount,
                mint: mintKeypair.publicKey,
                signer: payer.publicKey,
            })
            .rpc();
        console.log("Your transaction signature", tx);
    });
});
