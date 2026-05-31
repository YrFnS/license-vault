export const LIMIT = 20;

export const US_STATES = [
	"AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA",
	"HI","ID","IL","IN","IA","KS","KY","LA","ME","MD",
	"MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
	"NM","NY","NC","ND","OH","OK","OR","PA","RI","SC",
	"SD","TN","TX","UT","VT","VA","WA","WV","WI","WY","DC",
];

export const TRADE_TYPES = [
	"electrical","plumbing","hvac","general","roofing","concrete","painting","landscaping","other",
];

export const fadeIn = {
	initial: { opacity: 0, y: 10 },
	animate: { opacity: 1, y: 0 },
	exit: { opacity: 0, y: -10 },
};

export const staggerContainer = {
	animate: { transition: { staggerChildren: 0.05 } },
};

export const staggerItem = {
	initial: { opacity: 0, y: 10 },
	animate: { opacity: 1, y: 0 },
};
