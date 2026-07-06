// Everyday technology and when it arrived — used for "invented after you were born".
// date: when it became available/public. icon: emoji. wiki: article slug.

export interface TechItem {
  date: string
  name: string
  icon: string
  blurb: string
  wiki: string
}

const technology: TechItem[] = [
  { date: '1950-02-01', name: 'The credit card', icon: '💳', blurb: 'Diners Club issues the first multi-use charge card.', wiki: 'Diners_Club_International' },
  { date: '1954-10-18', name: 'Transistor radio', icon: '📻', blurb: 'The Regency TR-1 puts music in your pocket.', wiki: 'Regency_TR-1' },
  { date: '1955-06-01', name: 'Wireless TV remote', icon: '📺', blurb: 'Zenith’s "Flash-Matic" ends the walk to the television.', wiki: 'Remote_control' },
  { date: '1959-08-13', name: 'Three-point seat belt', icon: '🚗', blurb: 'Volvo gives the patent away for free; millions of lives saved.', wiki: 'Seat_belt' },
  { date: '1960-05-16', name: 'The laser', icon: '🔦', blurb: 'Theodore Maiman fires the first working laser.', wiki: 'Laser' },
  { date: '1963-08-30', name: 'Cassette tape', icon: '📼', blurb: 'Philips introduces the compact cassette.', wiki: 'Cassette_tape' },
  { date: '1967-06-27', name: 'The ATM', icon: '🏧', blurb: 'The first cash machine opens at a Barclays in London.', wiki: 'Automated_teller_machine' },
  { date: '1971-10-01', name: 'Email', icon: '📧', blurb: 'Ray Tomlinson sends the first networked email and picks the @ sign.', wiki: 'History_of_email' },
  { date: '1972-01-01', name: 'Pocket calculator', icon: '🔢', blurb: 'The HP-35 makes the slide rule obsolete.', wiki: 'HP-35' },
  { date: '1975-12-01', name: 'Digital camera', icon: '📷', blurb: 'Kodak engineer Steven Sasson builds the first one, at 0.01 megapixels.', wiki: 'Digital_camera' },
  { date: '1976-09-09', name: 'The VCR (VHS)', icon: '📼', blurb: 'JVC’s VHS lets you record TV and rent movies.', wiki: 'VHS' },
  { date: '1977-06-10', name: 'Apple II', icon: '🖥️', blurb: 'The personal computer arrives in homes.', wiki: 'Apple_II' },
  { date: '1979-07-01', name: 'Sony Walkman', icon: '🎧', blurb: 'Music becomes something you take with you.', wiki: 'Walkman' },
  { date: '1981-08-12', name: 'IBM PC', icon: '💻', blurb: 'The 5150 defines the personal computer standard.', wiki: 'IBM_Personal_Computer' },
  { date: '1982-10-01', name: 'The compact disc', icon: '💿', blurb: 'Digital music goes on sale in Japan.', wiki: 'Compact_disc' },
  { date: '1983-03-06', name: 'The cell phone', icon: '📱', blurb: 'Motorola’s DynaTAC 8000X: 2 lbs, $3,995, 30 minutes of talk.', wiki: 'Motorola_DynaTAC' },
  { date: '1984-01-24', name: 'Apple Macintosh', icon: '🖱️', blurb: 'The mouse and graphical interface go mainstream.', wiki: 'Macintosh_128K' },
  { date: '1985-11-20', name: 'Microsoft Windows', icon: '🪟', blurb: 'Windows 1.0 ships.', wiki: 'Windows_1.0' },
  { date: '1989-04-21', name: 'Game Boy', icon: '🎮', blurb: 'Nintendo puts video games in every backpack.', wiki: 'Game_Boy' },
  { date: '1991-08-06', name: 'The World Wide Web', icon: '🌐', blurb: 'Tim Berners-Lee opens the web to the public.', wiki: 'World_Wide_Web' },
  { date: '1992-12-03', name: 'Text messaging', icon: '💬', blurb: 'The first SMS: "Merry Christmas".', wiki: 'SMS' },
  { date: '1994-12-03', name: 'PlayStation', icon: '🕹️', blurb: 'Sony enters gaming and changes it forever.', wiki: 'PlayStation_(console)' },
  { date: '1996-11-01', name: 'The DVD', icon: '📀', blurb: 'Movies go digital at home.', wiki: 'DVD' },
  { date: '1998-09-04', name: 'Google', icon: '🔍', blurb: 'Two Stanford students index the internet.', wiki: 'Google' },
  { date: '1999-09-01', name: 'Wi-Fi', icon: '📶', blurb: 'The 802.11b standard cuts the ethernet cord.', wiki: 'Wi-Fi' },
  { date: '2000-05-02', name: 'Accurate GPS for everyone', icon: '🛰️', blurb: 'The US stops degrading civilian GPS signals overnight.', wiki: 'Global_Positioning_System' },
  { date: '2000-12-01', name: 'USB flash drive', icon: '🔌', blurb: 'Files finally fit on a keychain.', wiki: 'USB_flash_drive' },
  { date: '2001-01-15', name: 'Wikipedia', icon: '📚', blurb: 'The free encyclopedia anyone can edit.', wiki: 'Wikipedia' },
  { date: '2001-10-23', name: 'iPod', icon: '🎵', blurb: '1,000 songs in your pocket.', wiki: 'IPod' },
  { date: '2003-08-29', name: 'Skype', icon: '📞', blurb: 'Free video calls across the planet.', wiki: 'Skype' },
  { date: '2004-02-04', name: 'Facebook', icon: '👥', blurb: 'Social networking leaves the dorm room.', wiki: 'Facebook' },
  { date: '2005-02-14', name: 'YouTube', icon: '▶️', blurb: 'Everyone gets a broadcast channel.', wiki: 'YouTube' },
  { date: '2005-02-08', name: 'Google Maps', icon: '🗺️', blurb: 'Paper maps begin their retirement.', wiki: 'Google_Maps' },
  { date: '2006-07-15', name: 'Twitter', icon: '🐦', blurb: 'The world starts thinking in 140 characters.', wiki: 'Twitter' },
  { date: '2007-06-29', name: 'iPhone', icon: '📲', blurb: 'The smartphone as we know it.', wiki: 'IPhone_(1st_generation)' },
  { date: '2007-11-19', name: 'Kindle', icon: '📖', blurb: 'A library in one thin slab.', wiki: 'Amazon_Kindle' },
  { date: '2008-07-10', name: 'The App Store', icon: '🛍️', blurb: '"There’s an app for that" becomes true.', wiki: 'App_Store_(Apple)' },
  { date: '2008-10-07', name: 'Spotify', icon: '🎶', blurb: 'All of recorded music, streamed.', wiki: 'Spotify' },
  { date: '2009-01-03', name: 'Bitcoin', icon: '₿', blurb: 'The first cryptocurrency comes online.', wiki: 'Bitcoin' },
  { date: '2010-04-03', name: 'iPad', icon: '📟', blurb: 'The tablet finally sticks.', wiki: 'IPad_(1st_generation)' },
  { date: '2010-10-06', name: 'Instagram', icon: '📸', blurb: 'Life, filtered.', wiki: 'Instagram' },
  { date: '2011-10-04', name: 'Siri', icon: '🗣️', blurb: 'Phones start talking back.', wiki: 'Siri' },
  { date: '2012-06-22', name: 'Tesla Model S', icon: '⚡', blurb: 'Electric cars become desirable.', wiki: 'Tesla_Model_S' },
  { date: '2014-11-06', name: 'Amazon Echo & Alexa', icon: '🔊', blurb: 'Speakers start listening.', wiki: 'Amazon_Echo' },
  { date: '2015-04-24', name: 'Apple Watch', icon: '⌚', blurb: 'The computer moves to your wrist.', wiki: 'Apple_Watch' },
  { date: '2016-09-07', name: 'AirPods', icon: '🎧', blurb: 'Headphone cords vanish.', wiki: 'AirPods' },
  { date: '2016-08-01', name: 'TikTok', icon: '🎬', blurb: 'Short video takes over the world.', wiki: 'TikTok' },
  { date: '2020-12-11', name: 'mRNA vaccines', icon: '💉', blurb: 'A new vaccine technology arrives in record time.', wiki: 'MRNA_vaccine' },
  { date: '2022-11-30', name: 'ChatGPT', icon: '🤖', blurb: 'Conversational AI reaches 100 million users in two months.', wiki: 'ChatGPT' },
]

export function techAfter(dob: Date): TechItem[] {
  return technology
    .filter((t) => new Date(t.date) > dob)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
}

export default technology
