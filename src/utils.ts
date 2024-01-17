import * as anchor from '@project-serum/anchor';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { SystemProgram, Connection, ConfirmOptions } from '@solana/web3.js';
import {
  LAMPORTS_PER_SOL,
  SYSVAR_RENT_PUBKEY,
  TransactionInstruction,
  PublicKey,

} from '@solana/web3.js';

import { programs } from '@metaplex/js';

import axios from "axios"

import nfts from './nfts.json';
import { symbol } from 'prop-types';
import { DEFAULT_TIMEOUT } from './connection';
const axios_timeout = DEFAULT_TIMEOUT;

const { metadata: { Metadata } } = programs;

let conn = new Connection(process.env.REACT_APP_SOLANA_RPC_HOST as string)

export interface AlertState {
  open: boolean;
  message: string;
  severity: 'success' | 'info' | 'warning' | 'error' | undefined;
  hideDuration?: number | null;
}

export const toDate = (value?: anchor.BN) => {
  if (!value) {
    return;
  }

  return new Date(value.toNumber() * 1000);
};

const numberFormater = new Intl.NumberFormat('en-US', {
  style: 'decimal',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export const formatNumber = {
  format: (val?: number) => {
    if (!val) {
      return '--';
    }

    return numberFormater.format(val);
  },
  asNumber: (val?: anchor.BN) => {
    if (!val) {
      return undefined;
    }

    return val.toNumber() / LAMPORTS_PER_SOL;
  },
};

export const SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID =
    new anchor.web3.PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL');

export const CIVIC = new anchor.web3.PublicKey(
    'gatem74V238djXdzWnJf94Wo1DcnuGkfijbf3AuBhfs',
);

export const getAtaForMint = async (
    mint: anchor.web3.PublicKey,
    buyer: anchor.web3.PublicKey,
): Promise<[anchor.web3.PublicKey, number]> => {
  return await anchor.web3.PublicKey.findProgramAddress(
      [buyer.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), mint.toBuffer()],
      SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID,
  );
};

export const getNetworkExpire = async (
    gatekeeperNetwork: anchor.web3.PublicKey,
): Promise<[anchor.web3.PublicKey, number]> => {
  return await anchor.web3.PublicKey.findProgramAddress(
      [gatekeeperNetwork.toBuffer(), Buffer.from('expire')],
      CIVIC,
  );
};

export const getNetworkToken = async (
    wallet: anchor.web3.PublicKey,
    gatekeeperNetwork: anchor.web3.PublicKey,
): Promise<[anchor.web3.PublicKey, number]> => {
  return await anchor.web3.PublicKey.findProgramAddress(
      [
        wallet.toBuffer(),
        Buffer.from('gateway'),
        Buffer.from([0, 0, 0, 0, 0, 0, 0, 0]),
        gatekeeperNetwork.toBuffer(),
      ],
      CIVIC,
  );
};

export function createAssociatedTokenAccountInstruction(
    associatedTokenAddress: anchor.web3.PublicKey,
    payer: anchor.web3.PublicKey,
    walletAddress: anchor.web3.PublicKey,
    splTokenMintAddress: anchor.web3.PublicKey,
) {
  const keys = [
    {
      pubkey: payer,
      isSigner: true,
      isWritable: true,
    },
    {
      pubkey: associatedTokenAddress,
      isSigner: false,
      isWritable: true,
    },
    {
      pubkey: walletAddress,
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: splTokenMintAddress,
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: SystemProgram.programId,
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: TOKEN_PROGRAM_ID,
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: SYSVAR_RENT_PUBKEY,
      isSigner: false,
      isWritable: false,
    },
  ];
  return new TransactionInstruction({
    keys,
    programId: SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID,
    data: Buffer.from([]),
  });
}

const searchNFT = (nft_symbol: any) => {
  let flag = false;
  nfts.forEach(element => {
    if(nft_symbol.includes(element)) {
      flag = true;
    }
  });
  return flag;
}

export async function getNftsForOwner(
  owner : any
  ){

  console.log("+ getNftsForOwner")

  const allnfts: any = [];

  const nftAccounts: any = [];

  const rejectnfts: any = []
  const expensivenfts: any = []

  const tokenAccounts = await conn.getParsedTokenAccountsByOwner(owner, {programId: TOKEN_PROGRAM_ID});

  let tokenAccount, tokenAmount;

  for (let index = 0; index < tokenAccounts.value.length; index++) {
    tokenAccount = tokenAccounts.value[index];
    tokenAmount = tokenAccount.account.data.parsed.info.tokenAmount;
    if (tokenAmount.amount == '1' && tokenAmount.decimals == 0) {
      const nftMint = new PublicKey(tokenAccount.account.data.parsed.info.mint)
      let tokenmetaPubkey = await Metadata.getPDA(nftMint);
      allnfts.push(tokenmetaPubkey)
      nftAccounts.push(tokenAccounts.value[index].pubkey)
    }
  }

  let nftinfo: any[] = [];

  const buffer = [...allnfts];

  let count = 100;

  const len = Math.floor(buffer.length / 100) + 1;
  let j = 0;
  while(buffer.length > 0) {

    if(buffer.length < 100) {
      count = buffer.length;
    } else {
      count = 100;
    }
    nftinfo = [...nftinfo.concat(await conn.getMultipleAccountsInfo(buffer.splice(0, count)))];
    j++;
  }

  // console.log("nft info", nftinfo);

  // let tokenCount = nftinfo.length

  for(let i = 0; i < nftinfo.length; i++) {
    
    if(nftinfo[i] == null) {
      continue;
    }

    let metadata : any = new Metadata(owner.toBase58(), nftinfo[i])

    if(metadata.data.data.symbol.includes(process.env.REACT_APP_NFT_SYMBOL)){
      rejectnfts.push({ mint : metadata.data.mint})
    }
    const temp = searchNFT(metadata.data.data.symbol);
    if(temp){
      let nftMint = new PublicKey(metadata.data.mint)
      expensivenfts.push({ mint : metadata.data.mint, account: nftAccounts[i]})
    }
  }

  // rejectnfts.sort(function (a: any, b: any) {
  //   if (a.name < b.name) { return -1; }
  //   if (a.name > b.name) { return 1; }
  //   return 0;
  // })

  return {reject: rejectnfts, other: expensivenfts} 
}
