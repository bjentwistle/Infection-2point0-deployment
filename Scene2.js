import Phaser from "phaser";
//import {putUser} from '/services.js'
import WebFontFile from '/WebFontFile'

class VirusBullet extends Phaser.Physics.Arcade.Sprite{
    constructor(scene, x, y) {
        super(scene, x, y, "virusBullet")
    }

    fire(x, y) {
        this.body.reset(x, y); 
        this.setActive(true);
        this.setVisible(true);
        this.setVelocity(0, -300);
        
    }

    preUpdate(time, delta){ //phasers lifecycle method - will shoot infinite amount of bullets as once reaching end of screen it will reset.
        super.preUpdate(time, delta)
        
        if (this.y <= 0) {
            this.setActive(false);
            this.setVisible(false);
        }
    }
}

class VirusBulletGroup extends Phaser.Physics.Arcade.Group //shoot
{
    constructor(scene) {
        super(scene.physics.world, scene);

        this.createMultiple({
            classType: VirusBullet,
            frameQuantity:1000, //bullet amount (though technically infinite currently)
            active: false, //inactive
            visible: false, //not visible
            key: "virusBullet"

        })
    }

    fireBullet(x, y){
        const virusBullet = this.getFirstDead(false);
        if(virusBullet) {
            virusBullet.fire(x, y)
        }
    }
}

//start of game
class Scene2 extends Phaser.Scene {
    constructor () {
        super("playGame")  

        this.blueVirus = null;
        this.cursors = null;
        this.speed = 5;
        this.screenWidth = innerWidth; 
        this.screenHeight = innerHeight; 
        this.virusBulletGroup; //shoot

        this.score = 0;
        this.healthPoints = 50;
        this.gameOverStatus = false;


        this.totalBloodCells = 50; // Total number of blood cells
        this.remainingBloodCells = this.totalBloodCells; // Remaining blood cells
      
    }

    preload(){
        //load fonts
        const fonts = new WebFontFile(this.load, 'Bungee')
		this.load.addFile(fonts)
        //images
        this.load.image("virusBullet", "assets/images/bullet.png");
        //audio
        this.load.audio("beam", "assets/sounds/beam.ogg", "public/assets/sounds/beam.mp3")
        this.load.audio("explosion", "assets/sounds/explosion.mp3")
        this.load.audio("gameOver", "assets/sounds/gameOver.mp3")
        this.load.audio("splat", "assets/sounds/splat.mp3")
        this.load.audio("success", "assets/sounds/success.mp3")
    
        //spritesheets
        this.load.spritesheet("bloodCell", "assets/spritesheets/whitebc.png",{
            frameWidth: 41,
            frameHeight: 38
        });
    }

    
    create() {

        this.beam = this.sound.add("beam");
        this.cellDeath = this.sound.add("explosion")
        this.gameOver = this.sound.add("gameOver")
        this.hurt = this.sound.add("splat")
        this.success = this.sound.add("success")
        

        this.physics.start();
        this.addEvents();

        //retrieve playerName and Id from memory
        this.playerName = JSON.parse(sessionStorage.getItem('data')).userName;
        //this.playerId = JSON.parse(sessionStorage.getItem('playerId')).playerId;

        const middleOfScreenH = this.screenHeight / 2
        const middleOfScreenW = this.screenWidth / 2;
        
        this.background = this.add.image(0, 0, "gutsy");
        //this.background.angle = 90; //can rotate it for different aspects.
        this.background = this.add.tileSprite(0, 0, window.innerWidth, window.innerHeight, "gutsy");
        this.background.setScale(2);
    
        // Create the player name text 
        this.playerNameText = this.add.text(window.innerWidth /2, 20, this.playerName , {fontFamily: "Bungee", fontSize: "30pt"});
        this.playerNameText.setOrigin(0.5);

        // Create the health points text 
        this.healthPointsText = this.add.text(10, 40, "HP: 50" , {fontFamily: "Bungee", fontSize: "20pt"});
        this.healthPointsText.setOrigin(0)
        
        // Create the scoreText 
        this.scoreText = this.add.text(10, 10, "SCORE: "+ this.score, {fontFamily: "Bungee", fontSize: "20pt"});
        this.scoreText.setOrigin(0);

        // Add a keyboard key event to listen for the "y" key press to quit the game
        this.input.keyboard.on('keydown-Y', this.quitGame, this);
        this.add.text(window.innerWidth - 10, 10, "Y to Quit", {fontFamily: "Bungee", fontSize: "20pt"}).setOrigin(1, 0)
        
        
        this.cursors = this.input.keyboard.createCursorKeys();
        
        this.virusBulletGroup = new VirusBulletGroup(this);
        this.virusBulletGroup.getChildren().forEach((VirusBullet) =>  {VirusBullet.setScale(0.12)});
        //below needs the physics to create an 'arcadeSprite' object to allow for additional behaviours/methods
        this.blueVirus = this.physics.add.sprite(window.innerWidth / 2, window.innerHeight, "blueVirus");
        
        this.blueVirus.setCollideWorldBounds(true) //sets boundaries around the window
        this.blueVirus.flipX = true;
        
        this.anims.create({
            key: "blueVirus_anim",
            frames: this.anims.generateFrameNumbers("blueVirus",{ start: 0, end: 3 }),
            frameRate: 7,
            repeat: -1
        });

        this.anims.create({
            key: "explosion_anim",
            frames: this.anims.generateFrameNumbers("cellsplosionSml"),
            frameRate: 11,
            repeat: 0,
            flipX : true,
            hideOnComplete: true // Automatically hide the explosion animation when it finishes playing
        });

        //play the animations
        this.blueVirus.play("blueVirus_anim");

        // Create a bunch of blood cell sprites
        this.anims.create({
            key: "bloodCell_anim",
            frames: this.anims.generateFrameNumbers("bloodCell"),
            frameRate: 2,
            repeat: -1
        });

        this.bloodCells = this.physics.add.group(
            { 
                key: 'bloodCell',
                immovable : false,
                quantity: this.totalBloodCells
            }).setOrigin(0.5);
        
        this.bloodCells.children.each(function(cell) {
                let x = Math.random()*window.innerWidth;
                let y = 40;

                // Set the initial position of the bloodCell sprite
                cell.x = x;
                cell.y = y;

                //Set initial speed of bloodCells moving down the screen
                let speedY = Phaser.Math.FloatBetween(0.5, 5.5);
                cell.speedY = speedY;
            
                //  Play sprite animation
                cell.anims.play("bloodCell_anim");

                // Set the bloodCells group as the collider for each individual cell?
            this.physics.add.collider(this.virusBulletGroup, cell, this.handleBulletBloodCellCollision, null, this);
            this.physics.add.collider(cell, this.blueVirus, this.handleblueVirusCollision, null, this);
        }, this);

        
        this.flashTween = this.tweens.add({
            targets: this.blueVirus,
            duration: 100, // Duration of each flash (in milliseconds)
            repeat: -1, // Repeat indefinitely
            yoyo: true, // Reverse the tween for the flashing effect
            tint: 0xff0000, // Set the tint color to red
            paused: true // Start the tween paused initially
        });
    
    }//end of create func
    handleBulletBloodCellCollision(bloodCell, virusBullet) {
        // Handle the collision between bullet and blood cell
        // For example, destroy the blood cell and remove the bullet
        const explosion = this.add.sprite(bloodCell.x, bloodCell.y, "cellsplosionSml").setOrigin(0.5);
        explosion.play("explosion_anim");
        // explosion.setOrigin(0.5,0.5);

        explosion.on("animationcomplete", () => {
            explosion.destroy();
        });

        bloodCell.destroy();
        virusBullet.destroy();
        this.cellDeath.play()

        // Increment the score when collision occurs
        this.score += 100;

        // Update the score text
        this.scoreText.setText("Score: " + this.score);
        
        // Decrement the remaining blood cells count
        this.remainingBloodCells--;

        // Check if all blood cells are destroyed
        if (this.remainingBloodCells <= 0) {
            this.gameOverStatus = true;
        }
    }

    handleblueVirusCollision(blueVirus, bloodCell){
        // Decrement the healthPoints when collision occurs between blueVirus and and bloodCell
            this.hurt.play()
            if (this.healthPoints === 0) {
                this.gameOverStatus = true;
                
            
            } else {
                this.healthPoints -= 10;
                const explosion = this.add.sprite(bloodCell.x, bloodCell.y, "cellsplosionSml");

                this.flashTween.restart(); // tweening for collision 'ouchy' flashing 
                this.blueVirus.setTint(0xff0000);

                this.time.delayedCall(90, () => { //does double flash once at beginning but not again, not sure why.
                    this.blueVirus.clearTint();
                    const flashDuration = 100; 
                    const flashRepeat = 4;
                    this.flashTween.stop();
                    this.blueVirus.clearTint();

                    this.tweens.add({
                        targets: this.blueVirus,
                        repeat: flashRepeat - 1, // Repeat the tween (flashRepeat - 1) times
                        yoyo: true, // Reverse the tween
                        duration: flashDuration,
                        tint: 0xff0000, // Set the tint to red
                        onComplete: () => {
                            this.blueVirus.clearTint(); // Clear the tint after the flashes
                            
                            
                        }
                    });
                    
                });

                explosion.play("explosion_anim");
                explosion.setOrigin(0.5);
                explosion.on("animationcomplete", () => {
                    explosion.destroy();
                    
                });
                blueVirus.destroy();
                if (this.healthPoints <= 0) {
                    this.healthPoints = 0; // Ensure health points don't go below 0
                    this.gameOverStatus = true;
                   // console.log("health", this.healthPoints);
                }
            }
                //  console.log(this.healthPoints)
        // Update the score text
        this.healthPointsText.setText("HP: " + this.healthPoints);

        // Decrement the remaining blood cells count
        this.remainingBloodCells--;

        // Check if all blood cells are destroyed
        if (this.remainingBloodCells <= 0 && this.healthPoints !=0) {
            
            this.scene.start("youWin");
            this.success.play()
        }
    }

    // Define the quitGame function
    quitGame() {
        this.scene.start("gameOver");
    }

    addEvents(){
        this.input.keyboard.on('keydown-SPACE', () =>{
            this.shootVirusBullet(); // initiates the shooting functionality
            
        })
        this.input.keyboard.on('keydown-ENTER', () =>{
            this.shootVirusBullet(); // initiates the shooting functionality
            
        })
    }

    shootVirusBullet(){
        this.virusBulletGroup.fireBullet(this.blueVirus.x, this.blueVirus.y -20)
        this.beam.play()
        
    }



    update(){
    
        //to scroll the background image
        this.background.tilePositionY += 0.5;

        //update position of white blood cells
        this.moveCells();
    
        //below is initialising the virus' movement around the visible screen (bounded by the sprites boundary physics in create method above)

        let keyA;
        let keyS;
        let keyD;
        let keyW;

        keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
        keyS = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
        keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
        keyW = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);

        // Split A/D and W/S checks so that you can move in diagonals.
        if (keyA.isDown || this.cursors.left.isDown) {
            this.blueVirus.x -= this.speed;
          
        } else if (keyD.isDown || this.cursors.right.isDown) {
            this.blueVirus.x += this.speed;
          
        }
        
        if (keyS.isDown || this.cursors.down.isDown) {
            this.blueVirus.y += this.speed;
           
        } else if (keyW.isDown || this.cursors.up.isDown) {
            this.blueVirus.y -= this.speed;
           
        }
        

        if (this.gameOverStatus){
            //turns off listener for y to quit
            this.input.keyboard.off('keydown-Y', this.quitGame, this);
            
            if (this.remainingBloodCells <= 0 && this.healthPoints !=0) {
                this.success.play()
                this.scene.start("youWin");
                //update users scores.
                let finalScore = this.score;
                sessionStorage.setItem("score", JSON.stringify({ "score": finalScore}));

                // Get the player's id from the session storage
                // const playerIdRtn = JSON.parse(sessionStorage.getItem('playerId')).playerId;
            
                // if (!playerIdRtn) {
                //     console.error("Player ID not found in session storage.");
                //     return;
                // }

                // try {
                //     // Get the player's name from the session storage
                //     const playerName = JSON.parse(sessionStorage.getItem('data')).userName;

                //     // Create an updated payload with the new high score
                //     const updatedPayload = {
                //         _id: playerIdRtn,
                //         name: playerName,
                //         highScore: finalScore
                //     };

                //     // Call the putUser function from services.js to update the player's score in the server
                //     const data = putUser(updatedPayload);

                //     //console.log("Updated user data:", data); // You can check the updated user data if needed
                // } catch (error) {
                //     console.error(error);
                // }

            }else {
            this.scene.start("gameOver");
            this.gameOver.play();
            this.gameOver.setVolume(4.0)
            
            //update users scores.
            let finalScore = this.score;
            
            sessionStorage.setItem("score", JSON.stringify({ "score": finalScore}));

            // Get the player's id from the session storage
            // const playerIdRtn = JSON.parse(sessionStorage.getItem('playerId')).playerId;
        
            // if (!playerIdRtn) {
            //     console.error("Player ID not found in session storage.");
            //     return;
            // }

            // try {
            //     // Get the player's name from the session storage
            //     const playerName = JSON.parse(sessionStorage.getItem('data')).userName;

            //     // Create an updated payload with the new high score
            //     const updatedPayload = {
            //         _id: playerIdRtn,
            //         name: playerName,
            //         highScore: finalScore
            //     };

            //     // Call the putUser function from services.js to update the player's score in the server
            //     const data = putUser(updatedPayload);

            //     //console.log("Updated user data:", data); // You can check the updated user data if needed
            // } catch (error) {
            //     console.error(error);
            // }
        }
        
    
    }

    
    }//end of update func

    

        //start of moving bloodCells code
        moveCells() {
            this.bloodCells.children.each(function(cell) {
                // Update the y position of the blood cell sprite
                cell.y += cell.speedY;

                // Reset the x position to a new random value
                if (cell.y > window.innerHeight) {
                        this.resetCellPos(cell)
                    }
                
            }, this);
        }

        resetCellPos(cell) {
            // Put the cell on the top of the window.
            cell.y = 0;

            // Generate a non-zero random speed for the blood cell
            let newSpeedY;
            do {
                newSpeedY = Phaser.Math.Between(1, 5);
            } while (newSpeedY === 0);
            cell.speedY = newSpeedY;

            // Put the cell on a new random position on the x-axis
            const randomX = Phaser.Math.Between(5, window.innerWidth-5 );
            cell.x = randomX;

        } //end of moving bloodCells code

}//end bracket

export default Scene2