// Turns game events into the sounds, stamps and messages players see and hear. Pure, so it is tested in Node;
// the table screen performs what this returns.

/**
 * @param {object[]} events  the player's own filtered events from one state push
 * @param {{ you: string, nameOf: (id: string) => string }} ctx
 * @returns {{ sound?: string, banner?: {text: string, kind: string}, toast?: string, shake?: boolean, flash?: string, slam?: boolean }[]}
 */
export function feedbackFor(events, { you, nameOf }) {
  const out = [];
  for (const e of events) {
    switch (e.type) {
      case 'buyin': out.push({ sound: 'buyin' }); break;
      case 'bid': out.push({ sound: 'bid' }); break;
      case 'call': out.push({ sound: e.n === 1 ? 'gavel1' : 'gavel2' }); break;
      case 'sold':
        out.push({ sound: 'sold', slam: true, banner: { text: 'SOLD!', kind: 'sold' } });
        out.push({ toast: `${nameOf(e.playerId)} wins it for $${e.price.toLocaleString('en-US')}` });
        break;
      case 'fined':
        out.push({ sound: 'fine', banner: { text: 'FINED $1,000', kind: 'fined' } });
        out.push({ toast: `${nameOf(e.by)} could not pay and was fined $1,000` });
        break;
      case 'voided':
        // a Havoc found by a flip ends the round in the same push, so there is no crate left to animate: stamp it
        out.push({ sound: 'revealHavoc', banner: { text: 'VOID!', kind: 'void' }, shake: true, flash: '#c0123a' });
        break;
      case 'discarded': out.push({ toast: 'Nobody bought in. On to the next unit.' }); break;
      case 'eliminated':
        out.push({ sound: 'fine', banner: { text: e.by === you ? 'YOU ARE OUT' : 'ELIMINATED', kind: 'fined' } });
        out.push({ toast: `${nameOf(e.by)} is out of the game` });
        break;
      case 'auto-takeover': out.push({ toast: 'The server took over as Auctioneer for this round' }); break;
      default: break;
    }
  }
  return out;
}
