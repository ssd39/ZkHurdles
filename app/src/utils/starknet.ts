import {
  RpcProvider,
  Contract,
  num,
  hash,
  CallData,
  events,
  BigNumberish,
} from 'starknet';
import { getWalletAddress } from './storage';
import { StarknetWindowObject } from 'get-starknet-core';
import { toast } from 'react-toastify';

const abi = [
  {
    type: 'impl',
    name: 'CTSStarknetImpl',
    interface_name: 'cts::ICTSStarknet',
  },
  {
    type: 'struct',
    name: 'core::byte_array::ByteArray',
    members: [
      {
        name: 'data',
        type: 'core::array::Array::<core::bytes_31::bytes31>',
      },
      {
        name: 'pending_word',
        type: 'core::felt252',
      },
      {
        name: 'pending_word_len',
        type: 'core::integer::u32',
      },
    ],
  },
  {
    type: 'enum',
    name: 'core::bool',
    variants: [
      {
        name: 'False',
        type: '()',
      },
      {
        name: 'True',
        type: '()',
      },
    ],
  },
  {
    type: 'interface',
    name: 'cts::ICTSStarknet',
    items: [
      {
        type: 'function',
        name: 'create_room',
        inputs: [
          {
            name: 'context_id',
            type: 'core::byte_array::ByteArray',
          },
        ],
        outputs: [
          {
            type: 'core::integer::u64',
          },
        ],
        state_mutability: 'external',
      },
      {
        type: 'function',
        name: 'get_open_rooms',
        inputs: [],
        outputs: [
          {
            type: 'core::array::Array::<core::integer::u64>',
          },
        ],
        state_mutability: 'view',
      },
      {
        type: 'function',
        name: 'join_room',
        inputs: [
          {
            name: 'context_identity',
            type: 'core::byte_array::ByteArray',
          },
        ],
        outputs: [
          {
            type: 'core::integer::u64',
          },
        ],
        state_mutability: 'external',
      },
      {
        type: 'function',
        name: 'get_room_info',
        inputs: [
          {
            name: 'room_id',
            type: 'core::integer::u64',
          },
        ],
        outputs: [
          {
            type: 'core::array::Array::<core::felt252>',
          },
        ],
        state_mutability: 'view',
      },
      {
        type: 'function',
        name: 'claim_joining_bonus',
        inputs: [],
        outputs: [],
        state_mutability: 'external',
      },
      {
        type: 'function',
        name: 'is_bonus_claimed',
        inputs: [
          {
            name: 'user',
            type: 'core::starknet::contract_address::ContractAddress',
          },
        ],
        outputs: [
          {
            type: 'core::bool',
          },
        ],
        state_mutability: 'view',
      },
      {
        type: 'function',
        name: 'is_create_room',
        inputs: [],
        outputs: [
          {
            type: 'core::bool',
          },
        ],
        state_mutability: 'view',
      },
      {
        type: 'function',
        name: 'report_winner',
        inputs: [
          {
            name: 'room_id',
            type: 'core::integer::u64',
          },
          {
            name: 'vote_id',
            type: 'core::integer::u64',
          },
        ],
        outputs: [],
        state_mutability: 'external',
      },
      {
        type: 'function',
        name: 'send_invite_payload',
        inputs: [
          {
            name: 'payload',
            type: 'core::byte_array::ByteArray',
          },
          {
            name: 'room_id',
            type: 'core::integer::u64',
          },
        ],
        outputs: [],
        state_mutability: 'external',
      },
      {
        type: 'function',
        name: 'report_winner_calimero_state',
        inputs: [
          {
            name: 'room_id',
            type: 'core::integer::u64',
          },
          {
            name: 'vote_id',
            type: 'core::integer::u64',
          },
        ],
        outputs: [],
        state_mutability: 'external',
      },
    ],
  },
  {
    type: 'impl',
    name: 'ERC20MixinImpl',
    interface_name: 'openzeppelin_token::erc20::interface::IERC20Mixin',
  },
  {
    type: 'struct',
    name: 'core::integer::u256',
    members: [
      {
        name: 'low',
        type: 'core::integer::u128',
      },
      {
        name: 'high',
        type: 'core::integer::u128',
      },
    ],
  },
  {
    type: 'interface',
    name: 'openzeppelin_token::erc20::interface::IERC20Mixin',
    items: [
      {
        type: 'function',
        name: 'total_supply',
        inputs: [],
        outputs: [
          {
            type: 'core::integer::u256',
          },
        ],
        state_mutability: 'view',
      },
      {
        type: 'function',
        name: 'balance_of',
        inputs: [
          {
            name: 'account',
            type: 'core::starknet::contract_address::ContractAddress',
          },
        ],
        outputs: [
          {
            type: 'core::integer::u256',
          },
        ],
        state_mutability: 'view',
      },
      {
        type: 'function',
        name: 'allowance',
        inputs: [
          {
            name: 'owner',
            type: 'core::starknet::contract_address::ContractAddress',
          },
          {
            name: 'spender',
            type: 'core::starknet::contract_address::ContractAddress',
          },
        ],
        outputs: [
          {
            type: 'core::integer::u256',
          },
        ],
        state_mutability: 'view',
      },
      {
        type: 'function',
        name: 'transfer',
        inputs: [
          {
            name: 'recipient',
            type: 'core::starknet::contract_address::ContractAddress',
          },
          {
            name: 'amount',
            type: 'core::integer::u256',
          },
        ],
        outputs: [
          {
            type: 'core::bool',
          },
        ],
        state_mutability: 'external',
      },
      {
        type: 'function',
        name: 'transfer_from',
        inputs: [
          {
            name: 'sender',
            type: 'core::starknet::contract_address::ContractAddress',
          },
          {
            name: 'recipient',
            type: 'core::starknet::contract_address::ContractAddress',
          },
          {
            name: 'amount',
            type: 'core::integer::u256',
          },
        ],
        outputs: [
          {
            type: 'core::bool',
          },
        ],
        state_mutability: 'external',
      },
      {
        type: 'function',
        name: 'approve',
        inputs: [
          {
            name: 'spender',
            type: 'core::starknet::contract_address::ContractAddress',
          },
          {
            name: 'amount',
            type: 'core::integer::u256',
          },
        ],
        outputs: [
          {
            type: 'core::bool',
          },
        ],
        state_mutability: 'external',
      },
      {
        type: 'function',
        name: 'name',
        inputs: [],
        outputs: [
          {
            type: 'core::byte_array::ByteArray',
          },
        ],
        state_mutability: 'view',
      },
      {
        type: 'function',
        name: 'symbol',
        inputs: [],
        outputs: [
          {
            type: 'core::byte_array::ByteArray',
          },
        ],
        state_mutability: 'view',
      },
      {
        type: 'function',
        name: 'decimals',
        inputs: [],
        outputs: [
          {
            type: 'core::integer::u8',
          },
        ],
        state_mutability: 'view',
      },
      {
        type: 'function',
        name: 'totalSupply',
        inputs: [],
        outputs: [
          {
            type: 'core::integer::u256',
          },
        ],
        state_mutability: 'view',
      },
      {
        type: 'function',
        name: 'balanceOf',
        inputs: [
          {
            name: 'account',
            type: 'core::starknet::contract_address::ContractAddress',
          },
        ],
        outputs: [
          {
            type: 'core::integer::u256',
          },
        ],
        state_mutability: 'view',
      },
      {
        type: 'function',
        name: 'transferFrom',
        inputs: [
          {
            name: 'sender',
            type: 'core::starknet::contract_address::ContractAddress',
          },
          {
            name: 'recipient',
            type: 'core::starknet::contract_address::ContractAddress',
          },
          {
            name: 'amount',
            type: 'core::integer::u256',
          },
        ],
        outputs: [
          {
            type: 'core::bool',
          },
        ],
        state_mutability: 'external',
      },
    ],
  },
  {
    type: 'constructor',
    name: 'constructor',
    inputs: [
      {
        name: 'initial_supply',
        type: 'core::integer::u256',
      },
      {
        name: 'recipient',
        type: 'core::starknet::contract_address::ContractAddress',
      },
      {
        name: 'tee_moderator',
        type: 'core::starknet::contract_address::ContractAddress',
      },
    ],
  },
  {
    type: 'event',
    name: 'cts::CTSStarknet::RoomCreated',
    kind: 'struct',
    members: [
      {
        name: 'context_id',
        type: 'core::byte_array::ByteArray',
        kind: 'data',
      },
      {
        name: 'room_id',
        type: 'core::integer::u64',
        kind: 'key',
      },
    ],
  },
  {
    type: 'event',
    name: 'cts::CTSStarknet::RoomJoined',
    kind: 'struct',
    members: [
      {
        name: 'context_identity',
        type: 'core::byte_array::ByteArray',
        kind: 'data',
      },
      {
        name: 'room_id',
        type: 'core::integer::u64',
        kind: 'key',
      },
    ],
  },
  {
    type: 'event',
    name: 'cts::CTSStarknet::VoteConflict',
    kind: 'struct',
    members: [
      {
        name: 'room_id',
        type: 'core::integer::u64',
        kind: 'key',
      },
    ],
  },
  {
    type: 'event',
    name: 'cts::CTSStarknet::InvitePayload',
    kind: 'struct',
    members: [
      {
        name: 'payload',
        type: 'core::byte_array::ByteArray',
        kind: 'data',
      },
      {
        name: 'room_id',
        type: 'core::integer::u64',
        kind: 'key',
      },
    ],
  },
  {
    type: 'event',
    name: 'openzeppelin_token::erc20::erc20::ERC20Component::Transfer',
    kind: 'struct',
    members: [
      {
        name: 'from',
        type: 'core::starknet::contract_address::ContractAddress',
        kind: 'key',
      },
      {
        name: 'to',
        type: 'core::starknet::contract_address::ContractAddress',
        kind: 'key',
      },
      {
        name: 'value',
        type: 'core::integer::u256',
        kind: 'data',
      },
    ],
  },
  {
    type: 'event',
    name: 'openzeppelin_token::erc20::erc20::ERC20Component::Approval',
    kind: 'struct',
    members: [
      {
        name: 'owner',
        type: 'core::starknet::contract_address::ContractAddress',
        kind: 'key',
      },
      {
        name: 'spender',
        type: 'core::starknet::contract_address::ContractAddress',
        kind: 'key',
      },
      {
        name: 'value',
        type: 'core::integer::u256',
        kind: 'data',
      },
    ],
  },
  {
    type: 'event',
    name: 'openzeppelin_token::erc20::erc20::ERC20Component::Event',
    kind: 'enum',
    variants: [
      {
        name: 'Transfer',
        type: 'openzeppelin_token::erc20::erc20::ERC20Component::Transfer',
        kind: 'nested',
      },
      {
        name: 'Approval',
        type: 'openzeppelin_token::erc20::erc20::ERC20Component::Approval',
        kind: 'nested',
      },
    ],
  },
  {
    type: 'event',
    name: 'cts::CTSStarknet::Event',
    kind: 'enum',
    variants: [
      {
        name: 'RoomCreated',
        type: 'cts::CTSStarknet::RoomCreated',
        kind: 'nested',
      },
      {
        name: 'RoomJoined',
        type: 'cts::CTSStarknet::RoomJoined',
        kind: 'nested',
      },
      {
        name: 'VoteConflict',
        type: 'cts::CTSStarknet::VoteConflict',
        kind: 'nested',
      },
      {
        name: 'InvitePayload',
        type: 'cts::CTSStarknet::InvitePayload',
        kind: 'nested',
      },
      {
        name: 'ERC20Event',
        type: 'openzeppelin_token::erc20::erc20::ERC20Component::Event',
        kind: 'flat',
      },
    ],
  },
];
// initialize provider
const provider = new RpcProvider({
  nodeUrl: 'https://starknet-sepolia.public.blastapi.io',
});

const contractAddress =
  '0x07394878c01985f8f8eb0b7e75ce25b9d8665b9a45877aa2df631fa291a1bbe1';

const decimals = 10 ** 18;
// connect the contract
const contract = new Contract(abi, contractAddress, provider);

const isCreateRoom = async () => {
  const is_create_room = await contract.is_create_room();
  return is_create_room;
};

const getBalance = async () => {
  const balance = await contract.balance_of(getWalletAddress());
  console.log(balance);
  return (Number(balance) / decimals).toFixed(2);
};

const claim_bonus = async (wallet: StarknetWindowObject) => {
  const contract_ = new Contract(abi, contractAddress, wallet.account);
  const res = await contract_.claim_joining_bonus();
  await provider.waitForTransaction(res.transaction_hash);
  toast.success('🎉 Bonus claimed successfully! ✅');
  toast.success(`🆔 Transaction ID: ${res.transaction_hash}`);
};

const isClaimedBonus = async () => {
  return await contract.is_bonus_claimed(getWalletAddress());
};

const createRoom = async (wallet: StarknetWindowObject, context_id: string) => {
  const contract_ = new Contract(abi, contractAddress, wallet.account);
  const res = await contract_.create_room(context_id);
  const txRes: any = await provider.waitForTransaction(res.transaction_hash);
  toast.success('🎉 Room created successfully! ✅');
  toast.success(`🆔 Transaction ID: ${res.transaction_hash}`);
  console.log(txRes);
  const parsedData = contract.parseEvents(txRes);
  return Number(parsedData[1][Object.keys(parsedData[1])[0]].room_id);
};

const joinRoom = async (
  wallet: StarknetWindowObject,
  context_identity: string,
) => {
  const contract_ = new Contract(abi, contractAddress, wallet.account);
  const res = await contract_.join_room(context_identity);
  console.log(res);
  const txRes: any = await provider.waitForTransaction(res.transaction_hash);
  toast.success('🎉 Room Joined successfully! ✅');
  toast.success(`🆔 Transaction ID: ${res.transaction_hash}`);
  console.log(txRes);
  const parsedData = contract.parseEvents(txRes);
  console.log(parsedData);
  return Number(parsedData[1][Object.keys(parsedData[1])[0]].room_id);
};

async function getOpponent(room_id: number) {
  // Get initial block number

  const startBlock = await provider.getBlock('latest');
  let startBlockNumber = startBlock.block_number;
  const keyFilter = [
    ['0x0219b59aae3298b983ace43d8b95dffa504b7bb2a827b292bda2228c7fcf85d4'],
    [num.toHex(room_id)],
  ];
  async function getStarknetEvents({
    fromBlock = 429555,
    toBlock = 'latest',
    address = contractAddress,
    keys = [
      [
        '0x0219b59aae3298b983ace43d8b95dffa504b7bb2a827b292bda2228c7fcf85d4',
        '0x0c',
      ],
    ],
    chunkSize = 100,
  } = {}) {
    const response = await fetch(
      'https://starknet-sepolia.public.blastapi.io' /* 'https://free-rpc.nethermind.io/sepolia-juno/?apikey=ioLxy5ea6DQIIoyQVIlFRWwZBXymj1dvgA9zqCA5pAswb8KwK8TCTmwfXyN5U1jn'*/,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'starknet_getEvents',
          params: {
            filter: {
              from_block: {
                block_number: fromBlock,
              },
              to_block: toBlock,
              address: address,
              keys: keys,
              chunk_size: chunkSize,
            },
          },
          id: 1,
        }),
      },
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  }

  const abiEvents = events.getAbiEvents(abi);
  const abiStructs = CallData.getAbiStruct(abi);
  const abiEnums = CallData.getAbiEnum(abi);

  return new Promise(async (res) => {
    let x = setInterval(async () => {
      const customEvents = await getStarknetEvents({
        fromBlock: startBlockNumber,
        keys: keyFilter,
      });
      console.log(customEvents);
      const parsed = events.parseEvents(
        customEvents.result.events,
        abiEvents,
        abiStructs,
        abiEnums,
      );

      for (let event of parsed) {
        if (Object.hasOwn(event, 'cts::CTSStarknet::RoomJoined')) {
          const target = event['cts::CTSStarknet::RoomJoined'];
          if (Number(target.room_id) == room_id) {
            console.log('Found the target event!!');
            clearInterval(x);
            res(target);
          }
        }
      }
    }, 5000);
  });
}

async function getInvitePayload(room_id: number) {
  // Get initial block number
  const startBlock = await provider.getBlock('latest');
  let startBlockNumber = startBlock.block_number;
  const keyFilter = [
    ['0x04a8823f9620f16c3cfab3461897f312571c48eec9c00f36952d52adb57492e'],
    [num.toHex(room_id)],
  ];
  async function getStarknetEvents({
    fromBlock = 429555,
    toBlock = 'latest',
    address = contractAddress,
    keys = [
      [
        '0x04a8823f9620f16c3cfab3461897f312571c48eec9c00f36952d52adb57492e',
        '0x0c',
      ],
    ],
    chunkSize = 100,
  } = {}) {
    const response = await fetch(
      'https://starknet-sepolia.public.blastapi.io' /* 'https://free-rpc.nethermind.io/sepolia-juno/?apikey=ioLxy5ea6DQIIoyQVIlFRWwZBXymj1dvgA9zqCA5pAswb8KwK8TCTmwfXyN5U1jn'*/,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'starknet_getEvents',
          params: {
            filter: {
              from_block: {
                block_number: fromBlock,
              },
              to_block: toBlock,
              address: address,
              keys: keys,
              chunk_size: chunkSize,
            },
          },
          id: 1,
        }),
      },
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  }

  const abiEvents = events.getAbiEvents(abi);
  const abiStructs = CallData.getAbiStruct(abi);
  const abiEnums = CallData.getAbiEnum(abi);

  return new Promise(async (res) => {
    let x = setInterval(async () => {
      const customEvents = await getStarknetEvents({
        fromBlock: startBlockNumber,
        keys: keyFilter,
      });
      console.log(customEvents);
      const parsed = events.parseEvents(
        customEvents.result.events,
        abiEvents,
        abiStructs,
        abiEnums,
      );

      for (let event of parsed) {
        if (Object.hasOwn(event, 'cts::CTSStarknet::InvitePayload')) {
          const target = event['cts::CTSStarknet::InvitePayload'];
          if (Number(target.room_id) == room_id) {
            console.log('Found the target event!!');
            clearInterval(x);
            res(target);
          }
        }
      }
    }, 5000);
  });
}

const sendInvitePayload = async (
  wallet: StarknetWindowObject,
  room_id: number,
  payload: string,
) => {
  const contract_ = new Contract(abi, contractAddress, wallet.account);
  const res = await contract_.send_invite_payload(payload, room_id);
  const txRes: any = await provider.waitForTransaction(res.transaction_hash);
  toast.success('🎉 Invite sent! ✅');
  console.log(txRes);
};

export {
  isCreateRoom,
  getBalance,
  claim_bonus,
  isClaimedBonus,
  createRoom,
  joinRoom,
  getOpponent,
  sendInvitePayload,
  getInvitePayload,
};
