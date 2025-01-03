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
    PlayerWon {
        player_id: u8
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
    round: u64
}


static MAX_ALLOWED_MOVEMENT: i64 = 3;

#[app::logic]
impl AppState {

    #[app::init]
    pub fn init() -> AppState {
        AppState::default()
    }

    pub fn start_room(&mut self) -> Result<(), Error> {
        if self.player1.is_ready {
            return Err(Error::msg("You already started the room!"));
        }
        self.player1.id = env::executor_id();
        self.player1.is_ready = true;
        self.player1.health = 15;
        self.player1.remaining_blocker = 36;
        app::emit!(Event::PlayerReady { player_id: 0 });
        Ok(())
    }

    pub fn join_room(&mut self) -> Result<(), Error> {
        if !self.player1.is_ready {
            return Err(Error::msg("Player1 is not ready yet!"));
        }
        if self.player2.is_ready {
            return Err(Error::msg("Player2 is already joined!"));
        }
        self.player2.id = env::executor_id();
        self.player2.health = 15;
        self.player2.remaining_blocker = 36;
        self.player2.position.x = 11;
        self.player2.position.y = 11;
        self.player2.is_ready = true;
        app::emit!(Event::PlayerReady { player_id: 1 });
        Ok(())
    }

    pub fn take_move_chance(&mut self, x: i64, y: i64) -> Result<(), Error>  {
        if !self.player1.is_ready || !self.player2.is_ready {
            return Err(Error::msg("Both player must be ready before starting a game!"));
        }
        let mut player_id = 1;
        if self.round % 2 == 0 {
            player_id = 0;
            if  self.player1.id != env::executor_id() {
                return Err(Error::msg("Its Player1 chance!"));
            }
            if self.player1.locked_count > 0 {
                self.player1.locked_count -= 1;
                app::emit!(Event::PlayerMoved { player_id, x, y });
                if self.player1.locked_count == 0 {
                    if self.player1.health <= 1 {
                        self.player1.health = 15;
                    }
                    app::emit!(Event::PlayerUnlocked { player_id })
                }
                self.round += 1;
                return  Ok(());
            }
        } else {
            if  self.player2.id != env::executor_id() {
                return Err(Error::msg("Its Player2 chance!"));
            } 
            if self.player2.locked_count > 0 {
                self.player2.locked_count -= 1;
                app::emit!(Event::PlayerMoved { player_id, x, y });
                if self.player2.locked_count == 0 {
                    if self.player2.health <= 1 {
                        self.player2.health = 15;
                    }
                    app::emit!(Event::PlayerUnlocked { player_id })
                }
                self.round += 1;
                return Ok(());
            }
        }
        if x < 0 && x > 11 {
            return Err(Error::msg("Invalid X position!"));
        }

        if y < 0 && y > 11 {
            return Err(Error::msg("Invalid Y position!"));
        }
        let old_position = &self.player1.position;
        if (old_position.x - x).abs()  > MAX_ALLOWED_MOVEMENT {
            return Err(Error::msg("Invalid X position!"));
        }

        if (old_position.y - y).abs()  > MAX_ALLOWED_MOVEMENT {
            return Err(Error::msg("Invalid Y position!"));
        }

        if player_id == 0 {
            self.player1.position.x = x;
            self.player1.position.y = y;
            app::emit!(Event::PlayerMoved { player_id, x, y });
        } else {
            self.player2.position.x = x;
            self.player2.position.y = y;
            app::emit!(Event::PlayerMoved { player_id, x, y });
        }
        self.round += 1;
        app::emit!(Event::PlayerMoved { player_id, x, y });
        if player_id == 0 {
            if x==11 && y==11 {
                app::emit!(Event::PlayerWon { player_id });
            }
        } else {
            if x==0 && y==0 {
                app::emit!(Event::PlayerWon { player_id });
            }
        }
        Ok(())
    }

    pub fn place_blocker(&mut self, blocker_hash: String) -> Result<(), Error>  {
        let mut player_id = 1;
        if self.round % 2 == 0 {
            player_id = 0;
            if  self.player1.id != env::executor_id() {
                return Err(Error::msg("Its Player1 chance!"));
            }
            if self.player1.remaining_blocker == 0 {
                return Err(Error::msg("No more blocker left!"));
            }
            self.player1.remaining_blocker -= 1
        } else {
            if  self.player2.id != env::executor_id() {
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
                app::emit!(Event::BlockerPlaced { player_id });
                self.round += 1;
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
            player_id = 0;
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
 
        if variant == 0 {
            if player1.bv1c >= 15 {
                return Err(Error::msg("Maximum count used!"));
            }
            player1.bv1c += 1;
            player2.locked_count = 1;
            app::emit!(Event::PlayerLocked { player_id });
        } else if variant == 1 {
            if player1.bv2c >= 11 {
                return Err(Error::msg("Maximum count used!"));
            }
            player1.bv2c += 1;
            player2.health -= 5;
            if player2.health <= 1 {
                player2.locked_count = 3;
                app::emit!(Event::PlayerLocked { player_id });
            }
        } else if variant == 2{
            if player1.bv3c >= 9 {
                return Err(Error::msg("Maximum count used!"));
            }
            player1.bv3c  += 1;
            player2.locked_count = 2;
            player2.health -= 5;
            if player2.health <= 1 {
                player2.locked_count = 4;
            }
            app::emit!(Event::PlayerLocked { player_id });
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

    pub fn get_round(&self) -> &u64 {
        &self.round
    }
}
