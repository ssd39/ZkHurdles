use core::starknet::ContractAddress;

#[starknet::interface]
pub trait ICTSStarknet<TContractState> {
    fn create_room(ref self: TContractState, context_id: ByteArray);
    fn get_open_rooms(self: @TContractState) -> Array<u64>;
    fn join_room(ref self: TContractState, context_identity: ByteArray);  
    fn get_room_info(self: @TContractState, room_id: u64) -> Array<felt252>;
    fn claim_joining_bonus(ref self: TContractState);
    fn is_bonus_claimed(self: @TContractState, user: ContractAddress) -> bool;
    fn report_winner(ref self: TContractState, room_id: u64, vote_id: u64);
    fn report_winner_calimero_state(ref self: TContractState, room_id: u64, vote_id: u64);
}


#[starknet::contract]
mod CTSStarknet {
    use starknet::storage::StoragePathEntry;
    use starknet::storage::{
        StoragePointerReadAccess, StoragePointerWriteAccess, Vec, Map, VecTrait, MutableVecTrait,
    };
    use core::starknet::{ContractAddress, contract_address_const, get_caller_address};
    use openzeppelin_token::erc20::{ERC20Component, ERC20HooksEmptyImpl};

    component!(path: ERC20Component, storage: erc20, event: ERC20Event);

    // ERC20 Mixin
    #[abi(embed_v0)]
    impl ERC20MixinImpl = ERC20Component::ERC20MixinImpl<ContractState>;
    impl ERC20InternalImpl = ERC20Component::InternalImpl<ContractState>;

     #[derive(Drop, Serde, starknet::Store)]
    struct Room {
        player1: ContractAddress,
        player2: ContractAddress,
        context_id: ByteArray,
        invitee_context_identity: ByteArray,
        p1_voted: bool,
        p2_voted: bool,
        p1_vote: u64,
        p2_vote: u64
    }

    #[storage]
    struct Storage {
        counter: u64,
        lazy_counter: u64,
        open_rooms: Vec<u64>,
        rooms: Map<u64, Room>,
        faucet: Map<ContractAddress, bool>,
        tee_moderator: ContractAddress,
        #[substorage(v0)]
        erc20: ERC20Component::Storage
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        RoomJoined: RoomJoined,
        VoteConflict: VoteConflict,
        #[flat]
        ERC20Event: ERC20Component::Event
    }

    #[derive(Drop, starknet::Event)]
    pub struct RoomJoined {
        pub context_identity: ByteArray,
        #[key]
        pub room_id: u64,
    }

    #[derive(Drop, starknet::Event)]
    pub struct VoteConflict {
        #[key]
        pub room_id: u64,
    }


    #[constructor]
    fn constructor(ref self: ContractState, initial_supply: u256, recipient: ContractAddress, tee_moderator: ContractAddress) {
        let name: ByteArray = "zkHurdlesCash";
        let symbol: ByteArray = "ZKH";
        self.erc20.initializer(name, symbol);
        self.erc20.mint(recipient, initial_supply);
        self.tee_moderator.write(tee_moderator);

        self.counter.write(1);
        self.lazy_counter.write(1);
    }

    #[abi(embed_v0)]
    impl CTSStarknetImpl of super::ICTSStarknet<ContractState> {

        fn claim_joining_bonus(ref self: ContractState) {
            let caller = get_caller_address();
            let is_claimed = self.faucet.entry(caller).read();
            assert(!is_claimed, 'Joining bonus already claimed');
            self.erc20.mint(caller, 100 *1000_000_000);
            self.faucet.entry(caller).write(true);
        }

        fn is_bonus_claimed(self: @ContractState, user: ContractAddress) -> bool {
            self.faucet.entry(user).read()
        }

        fn create_room(ref self: ContractState, context_id: ByteArray) {
            let room_id = self.counter.read();
            let room_id_lazy = self.lazy_counter.read();
            assert(room_id == room_id_lazy, 'Join already open room first!');
            let caller = get_caller_address();
            self.erc20.burn(caller, 10*1000_000_000);
            let new_room = Room {
                player1: caller,
                player2: contract_address_const::<0>(),
                context_id: context_id,
                invitee_context_identity: "",
                p1_vote: 0,
                p2_vote: 0,
                p1_voted: false,
                p2_voted: false
            };
            self.rooms.entry(room_id).write(new_room);
            self.open_rooms.append().write(room_id);
            self.counter.write(room_id + 1);
        }

        fn get_open_rooms(self: @ContractState) -> Array<u64> {
            let mut room_ids = array![];
            let room_id_lazy = self.lazy_counter.read();
            for i in room_id_lazy..self.open_rooms.len() {
                room_ids.append(self.open_rooms.at(i).read());
            };
            room_ids
        }

        fn join_room(ref self: ContractState, context_identity: ByteArray) {
            let room_id_lazy = self.lazy_counter.read();
            let caller = get_caller_address();
            let room_id = self.open_rooms.at(room_id_lazy).read();
            assert(room_id != 0, 'Room already occupied!');
            self.erc20.burn(caller, 10*1000_000_000);
            self.open_rooms.at(room_id_lazy).write(0);
            let mut room = self.rooms.entry(room_id).read();
            room.player2 = caller;
            room.invitee_context_identity = context_identity.clone();
            self.rooms.entry(room_id).write(room);
            self.lazy_counter.write(room_id_lazy + 1);
            // raise an event with context Identity so room/context creator can invite it
            self.emit(RoomJoined { room_id, context_identity});
        }

        fn get_room_info(self: @ContractState, room_id: u64) -> Array<felt252> {
            let room = self.rooms.entry(room_id).read();
            let mut output = array![];
            room.serialize(ref output);
            output
        }

        fn report_winner(ref self: ContractState, room_id: u64, vote_id: u64) {
            let caller = get_caller_address();
            let mut room = self.rooms.entry(room_id).read();
            assert(caller == room.player1 || caller == room.player2, 'You were not part of the room!!');
            assert((caller == room.player1 && !room.p1_voted) || (caller == room.player2 && !room.p2_voted), 'You already voted');
            if vote_id == 0 {
                room.p1_vote += 1;
            } else {
                room.p2_vote += 1;
            }
            if room.p1_vote == 1 && room.p2_vote == 1 {
                // raise an event so dao/autonomus dao can choose winner form calimero state
                self.emit(VoteConflict{ room_id });
            }
            if room.p1_vote == 2 {
                self.erc20.mint(room.player1, 18 *1000_000_000);
            } else if room.p1_vote == 2 {
                self.erc20.mint(room.player2, 18 *1000_000_000);
            }
            self.rooms.entry(room_id).write(room);
        }

        fn report_winner_calimero_state(ref self: ContractState, room_id: u64, vote_id: u64) {
            let caller = get_caller_address();
            // Only trusted execution autonomus account can moderator
            assert(caller == self.tee_moderator.read() , 'You are not tee_moderator!');
            let mut room = self.rooms.entry(room_id).read();
            assert(room.p1_vote==1 && room.p2_vote==2, 'tee_moderator not required!');
            if vote_id == 0 {
                room.p1_vote += 1;
                room.p2_vote -= 1;
                self.erc20.mint(room.player1, 18 *1000_000_000);
            }else{
                room.p2_vote += 1;
                room.p1_vote -= 1;
                self.erc20.mint(room.player1, 18 *1000_000_000);
            }
            self.rooms.entry(room_id).write(room);
        }
    }
}
