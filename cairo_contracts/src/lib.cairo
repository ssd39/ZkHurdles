
#[starknet::interface]
pub trait ICTSStarknet<TContractState> {
    fn create_room(ref self: TContractState, context_id: ByteArray);
    fn get_open_rooms(self: @TContractState) -> Array<u64>;
    fn join_room(ref self: TContractState, index: u64);  
    fn get_room_info(self: @TContractState, room_id: u64) -> Array<felt252>;
}


#[starknet::contract]
mod CTSStarknet {
    use starknet::storage::StoragePathEntry;
    use starknet::storage::{
        StoragePointerReadAccess, StoragePointerWriteAccess, Vec, Map, VecTrait, MutableVecTrait,
    };
    use core::starknet::{ContractAddress, contract_address_const, get_caller_address};

     #[derive(Drop, Serde, starknet::Store)]
    struct Room {
        player1: ContractAddress,
        player2: ContractAddress,
        is_claimed: bool,
        context_id: ByteArray
    }

    #[storage]
    struct Storage {
        counter: u64,
        open_rooms: Vec<u64>,
        rooms: Map<u64, Room>
    }

    #[constructor]
    fn constructor(ref self: ContractState) {
        self.counter.write(1);
    }

    #[abi(embed_v0)]
    impl CTSStarknetImpl of super::ICTSStarknet<ContractState> {

        fn create_room(ref self: ContractState, context_id: ByteArray) {
            let caller = get_caller_address();
            let room_id = self.counter.read();
            let new_room = Room {
                player1: caller,
                player2: contract_address_const::<0>(),
                is_claimed: false,
                context_id: context_id
            };
            self.rooms.entry(room_id).write(new_room);
            self.open_rooms.append().write(room_id);
            self.counter.write(room_id + 1);
        }

        fn get_open_rooms(self: @ContractState) -> Array<u64> {
            let mut room_ids = array![];
            for i in 0..self.open_rooms.len() {
                room_ids.append(self.open_rooms.at(i).read());
            };
            room_ids
        }

        fn join_room(ref self: ContractState, index: u64) {
            let caller = get_caller_address();
            let room_id = self.open_rooms.at(index).read();
            assert(room_id != 0, 'Room already occupied!');
            self.open_rooms.at(index).write(0);
            let mut room = self.rooms.entry(room_id).read();
            room.player2 = caller;
            self.rooms.entry(room_id).write(room);
        }

        fn get_room_info(self: @ContractState, room_id: u64) -> Array<felt252> {
            let room = self.rooms.entry(room_id).read();
            let mut output = array![];
            room.serialize(ref output);
            output
        }
    }
}
