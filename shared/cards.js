// Card data shared by the server (rules) and the browser (rendering).
// Values are validated by tools/balance-sim/sim.py. Tune them here.

export const TIERS = ['junk', 'common', 'valuable', 'unique', 'havoc'];

// 24 letters: O and I removed so codes are easy to read out loud.
export const ROOM_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ';

const HAVOC_RULE = 'Void the entire Storage Unit and its Items if this Havoc card is Flipped or Won.';

// [name, value, flavor]
const RAW = {
  junk: [
    ['Worn Tires', -100, 'Four of them, none matching, all bald.'],
    ['Cracked Flower Pot', -100, 'The flowers left years ago. So did the dirt.'],
    ['Tangled Christmas Lights', -100, 'One strand, forty knots, zero working bulbs.'],
    ['Broken Umbrella', -100, 'Keeps the rain off in spirit only.'],
    ['Dented Trash Can', -100, 'Someone has already thrown it away once.'],
    ['Box of Mismatched Socks', -100, 'Not a single pair. Not one.'],
    ['Busted Treadmill', -200, "Hasn't moved since the last New Year's resolution."],
    ['Moldy Couch', -200, 'It has a smell, and the smell has a smell.'],
    ['Leaky Cooler', -200, 'Holds warm water extremely well.'],
    ['Broken CRT TV', -200, 'Weighs a ton, shows nothing.'],
    ['Rusty Bike Frame', -200, 'A bike, if you squint and lie.'],
    ['Soiled Mattress', -300, 'Do not ask. Do not look. Do not sit.'],
    ['Expired Paint Cans', -300, 'Every color is now brown.'],
    ['Cracked Aquarium', -300, 'The fish escaped. So did the water.'],
    ['Dead Fridge', -300, 'Whatever is inside has its own ecosystem.'],
    ['Rat-Chewed Wiring', -400, 'The rats got the best part.'],
    ['Bucket of Mystery Goo', -400, 'It moved when you looked away.'],
    ['Barrels of Mystery Sludge', -500, 'Someone paid to get rid of this. Now you own it.'],
    ['Asbestos Tiles', -500, 'Cheap to buy, expensive to remove.'],
  ],
  common: [
    ['Family Photos', 0, 'Nobody in any of them is smiling.'],
    ['Empty Cardboard Boxes', 0, 'Great for moving, terrible for value.'],
    ['Stack of Old Receipts', 0, 'Proof that someone once bought things.'],
    ['Single Left Shoe', 0, "The right one is somebody else's problem."],
    ['Paperback Books', 100, 'Well loved, spine cracked, ending spoiled.'],
    ['Garden Gnomes', 100, 'They watch. They always watch.'],
    ['Kitchen Utensils', 100, 'A whisk, a ladle, and one mystery tool.'],
    ['Winter Coats', 200, 'Warm, ugly, and in style somewhere.'],
    ['Lawn Chairs', 200, 'Three legs good, four legs better.'],
    ['Toolbox', 200, 'Half the tools, all the rust.'],
    ['Power Drill Set', 300, 'Holes made easy, returns made impossible.'],
    ['Starter Guitar', 300, 'Knows exactly three chords.'],
    ['Camping Gear', 300, 'A tent, a stove, and unfulfilled plans.'],
    ['Box of Board Games', 300, 'Every game is missing exactly one piece.'],
    ['Vintage Radio', 500, 'Static, one jazz station, zero regrets.'],
    ['Leather Jacket', 500, 'Instant cool, confidence sold separately.'],
    ['Espresso Machine', 500, 'Makes coffee, plus a loud opinion.'],
    ['Game Console', 500, 'Controllers sticky, save files legendary.'],
    ['Mountain Bike', 700, 'Has seen more garage than mountain.'],
    ['Drum Kit', 700, 'The neighbors will find you.'],
    ['Telescope', 700, 'Pointed at the moon. Allegedly.'],
    ['Designer Handbag', 700, "Real? Fake? That's what the auction is for."],
  ],
  valuable: [
    ['Vinyl Record Collection', 2000, 'Warm sound, cold hard cash.'],
    ['Persian Rug', 2500, 'It really ties the whole unit together.'],
    ['Rare Comic Collection', 3000, 'Bagged, boarded, and never read.'],
    ['Pro Camera Kit', 3500, 'The lenses alone cost more than your car.'],
    ['Grandfather Clock', 4000, 'Still keeps time. Mostly the wrong time.'],
    ['Gold Coin Stash', 5000, 'Shiny, heavy, and a very good sign.'],
    ['Signed Baseball Collection', 6000, 'The signatures are real. Mostly.'],
    ['Vintage Pocketwatch', 8000, 'No steps counted, no heart rate, just class.'],
    ['Antique Sword', 9000, 'Sharp enough to be exciting, old enough to matter.'],
  ],
  unique: [
    ['Dinosaur Fossil', 12000, 'A bone to pick, 66 million years in the making.'],
    ['Modern Painting', 15000, 'Either a masterpiece or a mistake. Possibly both.'],
  ],
  havoc: [
    ['Water Damage', 0, HAVOC_RULE],
    ['Black Mold', 0, HAVOC_RULE],
    ['Fire Damage', 0, HAVOC_RULE],
    ['Termite Nest', 0, HAVOC_RULE],
  ],
};

const kebab = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export const ITEMS = TIERS.flatMap((tier) =>
  RAW[tier].map(([name, value, flavor]) => ({ id: `${tier}-${kebab(name)}`, tier, name, value, flavor })),
);

export const UNIT_IDS = ['locker', 'small', 'medium', 'large', 'jumbo'];

export const UNITS = {
  locker: { id: 'locker', name: 'Locker', items: 1, flip: false, peek: 'never', count: 3 },
  small: { id: 'small', name: 'Small', items: 2, flip: false, peek: 'after', count: 3 },
  medium: { id: 'medium', name: 'Medium', items: 3, flip: false, peek: 'before', count: 4 },
  large: { id: 'large', name: 'Large', items: 4, flip: true, peek: 'after', count: 3 },
  jumbo: { id: 'jumbo', name: 'Jumbo', items: 5, flip: true, peek: 'before', count: 3 },
};
