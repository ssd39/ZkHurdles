use calimero_sdk::{
    app::{self},
    borsh::{BorshDeserialize, BorshSerialize},
    env
};
use calimero_storage::collections::UnorderedMap;
use calimero_sdk::types::Error;
use sha2::{Sha256, Digest};
use calimero_sdk::serde::Serialize;

#[app::event]
pub enum Event {
    GameReadyToStart,
    PlayerReady {
        player_id: u8
    },
    PlayerMoved { 
        player_id: u8, 
        x: i64, 
        y: i64
    },
    BlockerPlaced {
        player_id: u8
    },
    Player2SignatureAdded {
        signature: Vec<u8>
    },
    PlayerWon {
        player_id: u8
    },
    AttestWin {
        siganture: Vec<u8>
    },
    PlayerLocked {
        player_id: u8
    },
    PlayerUnlocked {
        player_id: u8
    },
    BlockerRevealed {
        x: i64,
        y: i64,
        variant: u8
    }
}

#[derive(BorshDeserialize, BorshSerialize, Default, Serialize)]
#[borsh(crate = "calimero_sdk::borsh")]
#[serde(crate = "calimero_sdk::serde")]
pub struct Position {
    x: i64,
    y: i64,
}


#[derive(BorshDeserialize, BorshSerialize, Default, Serialize)]
#[borsh(crate = "calimero_sdk::borsh")]
#[serde(crate = "calimero_sdk::serde")]
pub struct Blocker {
    is_active: bool,
    position: Position,
    player: u8,
    variant: u8
}

#[derive(BorshDeserialize, BorshSerialize, Default, Serialize)]
#[borsh(crate = "calimero_sdk::borsh")]
#[serde(crate = "calimero_sdk::serde")]
pub struct Player {
    id: [u8;32],
    is_ready: bool,
    position: Position,
    health: u32,
    remaining_blocker: u32,
    locked_count: u32,
    bv1c: u32,
    bv2c: u32,
    bv3c: u32,
}

#[app::state(emits = Event)]
#[derive(Default, BorshDeserialize, BorshSerialize)]
#[borsh(crate = "calimero_sdk::borsh")]
pub struct AppState {
    player1: Player,
    player2: Player,
    blockers: UnorderedMap<String, Blocker>,
    round: u64,
    challange: String,
    win_attested: bool
}


static MAX_ALLOWED_MOVEMENT: i64 = 5;

#[app::logic]
impl AppState {

    #[app::init]
    pub fn init() -> AppState {
        AppState::default()
    }

    pub fn start_room(&mut self, challange: String) -> Result<(), Error> {
        if self.player1.is_ready {
            return Err(Error::msg("You already started the room!"));
        }
        self.player1.id = env::executor_id();
        self.player1.is_ready = true;
        self.player1.health = 100;
        self.player1.remaining_blocker = 6;
        self.challange = challange;
        app::emit!(Event::PlayerReady { player_id: 1 });
        Ok(())
    }

    pub fn join_room(&mut self, signature: Vec<u8>) -> Result<(), Error> {
        if !self.player1.is_ready {
            return Err(Error::msg("Player1 is not ready yet!"));
        }
        if self.player2.is_ready {
            return Err(Error::msg("Player2 is already joined!"));
        }
        self.player2.id = env::executor_id();
        self.player2.health = 100;
        self.player2.remaining_blocker = 6;
        self.player2.position.x = 64;
        self.player2.position.y = 64;
        app::emit!(Event::Player2SignatureAdded { signature: signature });
        Ok(())
    }

    pub fn allow_player(&mut self) -> Result<(), Error> {
        self.player2.is_ready = true;
        app::emit!(Event::PlayerReady { player_id: 2 });
        Ok(())
    }

    pub fn attest_win(&mut self, signature: Vec<u8>) -> Result<(), Error> {
        app::emit!(Event::AttestWin { siganture: signature });
        self.win_attested = true;
        Ok(())
    }

    pub fn take_move_chance(&mut self, x: i64, y: i64) -> Result<(), Error>  {
        if !self.player1.is_ready || !self.player2.is_ready {
            return Err(Error::msg("Both player must be ready before starting a game!"));
        }
        let mut is_player_1 = false;
        let mut player_id = 2;
        if self.round % 2 == 0 {
            is_player_1 = true;
            player_id = 1;
            if  self.player1.id != env::executor_id() {
                return Err(Error::msg("Its Player1 chance!"));
            }
            if self.player1.locked_count > 0 {
                self.player1.locked_count -= 1;
                app::emit!(Event::PlayerMoved { player_id:player_id, x: x, y: y });
                if self.player1.locked_count == 0 {
                    if self.player1.health <= 1 {
                        self.player1.health = 100;
                    }
                    app::emit!(Event::PlayerUnlocked { player_id: 1 })
                }
                return  Ok(());
            }
        } else {
            if  self.player1.id != env::executor_id() {
                return Err(Error::msg("Its Player2 chance!"));
            } 
            if self.player2.locked_count > 0 {
                self.player2.locked_count -= 1;
                app::emit!(Event::PlayerMoved { player_id:player_id, x: x, y: y });
                if self.player2.locked_count == 0 {
                    if self.player2.health <= 1 {
                        self.player2.health = 100;
                    }
                    app::emit!(Event::PlayerUnlocked { player_id: 2 })
                }
                return Ok(());
            }
        }
        if x < 0 && x > 64 {
            return Err(Error::msg("Invalid X position!"));
        }

        if y < 0 && y > 64 {
            return Err(Error::msg("Invalid Y position!"));
        }
        let old_position = &self.player1.position;
        if (old_position.x - x).abs()  > MAX_ALLOWED_MOVEMENT {
            return Err(Error::msg("Invalid X position!"));
        }

        if (old_position.y - y).abs()  > MAX_ALLOWED_MOVEMENT {
            return Err(Error::msg("Invalid Y position!"));
        }

        if is_player_1 {
            self.player1.position.x = x;
            self.player1.position.y = y;
            app::emit!(Event::PlayerMoved { player_id:player_id, x: x, y: y });
        } else {
            self.player2.position.x = x;
            self.player2.position.y = y;
            app::emit!(Event::PlayerMoved { player_id:player_id, x: x, y: y });
        }
        self.round += 1;
        app::emit!(Event::PlayerMoved { player_id:player_id, x: x, y: y });
        if player_id == 0 {
            if x==64 && y==64 {
                app::emit!(Event::PlayerWon { player_id: player_id });
            }
        } else {
            if x==0 && y==0 {
                app::emit!(Event::PlayerWon { player_id: player_id });
            }
        }
        Ok(())
    }

    pub fn place_blocker(&mut self, blocker_hash: String) -> Result<(), Error>  {
        let mut player_id = 2;
        if self.round % 2 == 0 {
            player_id = 1;
            if  self.player1.id != env::executor_id() {
                return Err(Error::msg("Its Player1 chance!"));
            }
            if self.player1.remaining_blocker == 0 {
                return Err(Error::msg("No more blocker left!"));
            }
            self.player1.remaining_blocker -= 1
        } else {
            if  self.player1.id != env::executor_id() {
                return Err(Error::msg("Its Player2 chance!"));
            }  
            if self.player2.remaining_blocker == 0 {
                return Err(Error::msg("No more blocker left!"));
            }
            self.player2.remaining_blocker -= 1
        }
        // not revealing the position and varinet right now using blocker hash for that 
        let r = self.blockers.insert(blocker_hash, Blocker{
            is_active: true,
            player: player_id,
            variant: 0,
            position: Position{ x:0, y:0 }
        });
        match r {
            Ok(_) => {
                app::emit!(Event::BlockerPlaced { player_id: player_id });
                Ok(())
            },
            Err(e) => {
                env::log(e.to_string().as_str());
                Err(Error::msg("Error while updating state!"))
            },
        }
    }

    pub fn inform_blocker(&mut self, variant: u8, x: i64, y: i64, blocker_hash: String, secret: String) -> Result<(), Error> {
        let mut player1 = &mut self.player2;
        let mut player2 =  &mut self.player1;
        let mut player_id = 1;
        if self.round % 2 == 0 {
            player_id = 2;
            player1 = &mut self.player1;
            player2 = &mut self.player2;
        }

        let input = format!("{variant}:{x}:{y}:{secret}");
        // Compute the SHA-256 hash
        let mut hasher = Sha256::new();
        hasher.update(input);
        let computed_hash = format!("{:x}", hasher.finalize());
        if computed_hash != blocker_hash {
            return Err(Error::msg("Not able to prove the blocker!"));
        }

        let blocker = &mut self.blockers.get(&blocker_hash)?.unwrap();
        if !blocker.is_active  {
            return Err(Error::msg("Blocker already informed!"));
        }
        if player2.position.x != x || player2.position.y != y {
            return Err(Error::msg("Blocker is not correct!"));
        }
 
        if variant == 1 {
            if player1.bv1c >= 2 {
                return Err(Error::msg("Maximum count used!"));
            }
            player1.bv1c += 1;
            player2.locked_count = 1;
            app::emit!(Event::PlayerLocked { player_id: player_id });
        } else if variant == 2 {
            if player1.bv2c >= 3 {
                return Err(Error::msg("Maximum count used!"));
            }
            player1.bv2c += 1;
            player2.health -= 33;
            if player2.health <= 1 {
                player2.locked_count = 3;
                app::emit!(Event::PlayerLocked { player_id: player_id });
            }
        } else {
            if player1.bv3c >= 1 {
                return Err(Error::msg("Maximum count used!"));
            }
            player1.bv3c  += 1;
            player2.locked_count = 2;
            player2.health -= 33;
            if player2.health <= 1 {
                player2.locked_count = 4;
            }
            app::emit!(Event::PlayerLocked { player_id: player_id });
        }
        blocker.is_active = false;
        blocker.variant = variant;
        blocker.position.x = x;
        blocker.position.y = y;
        app::emit!(Event::BlockerRevealed { x: x, y: y, variant: variant });
        Ok(())
    }

    pub fn get_players_state(&self) -> (&Player, &Player) {
        (&self.player1, &self.player2)
    }
}
