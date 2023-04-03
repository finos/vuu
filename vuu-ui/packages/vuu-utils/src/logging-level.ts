// initial code for the use of cookies for logging level
export const loggingLevel = (level:string) => {
	const date = new Date();
	document.cookie = `logging-level=${level};expires=${date.toUTCString()};path=/`;
}