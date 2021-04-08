export function respondWithCliMessage(status: string, message: string) {
  switch (status) {
    case 'success':
      console.log("All done! We've updated your npm configuration.");
      break;

    case 'denied':
      console.log('You are not a member of the required org/team.');
      break;

    default:
      console.error(message);
      break;
  }
}
