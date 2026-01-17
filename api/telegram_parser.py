import asyncio
import asyncio
import logging
import os # For environment variables
from telethon import TelegramClient, errors
from telethon.tl.functions.channels import JoinChannelRequest
from telethon.tl.functions.messages import ImportChatInviteRequest
from telethon.tl.types import InputPeerChat, InputPeerChannel # Not strictly needed for join by link/username

# --- Configuration ---
# Attempt to read from environment variables, with fallbacks to the (insecure) hardcoded values.
# In a production environment, you should remove the fallbacks and ensure environment variables are set.
# TODO: Remove hardcoded fallbacks before production.
API_ID_ENV = os.getenv('TELEGRAM_API_ID')
API_HASH_ENV = os.getenv('TELEGRAM_API_HASH')
PHONE_NUMBER_ENV = os.getenv('TELEGRAM_PHONE_NUMBER')
SESSION_NAME_ENV = os.getenv('TELEGRAM_SESSION_NAME', 'telegram_parser_session') # Default session name if not set
TARGET_CHAT_INVITE_LINK_ENV = os.getenv('TELEGRAM_TARGET_CHAT_LINK')

# Using hardcoded values as fallbacks for now, as per original setup.
# IMPORTANT: These should NOT be committed with real values in a public repo.
API_ID = int(API_ID_ENV) if API_ID_ENV else 27784305
API_HASH = API_HASH_ENV if API_HASH_ENV else '4f3e696f0c035287a9716b07a78dfd18'
PHONE_NUMBER = PHONE_NUMBER_ENV if PHONE_NUMBER_ENV else '+79955970108'
SESSION_NAME = SESSION_NAME_ENV # Uses default from getenv if not set
TARGET_CHAT_INVITE_LINK = TARGET_CHAT_INVITE_LINK_ENV if TARGET_CHAT_INVITE_LINK_ENV else 'https://t.me/+hOuGcy5g9Nw1NjRl'

# Check if essential configurations are loaded, warn if still using hardcoded ones for critical fields
if not API_ID_ENV or not API_HASH_ENV or not PHONE_NUMBER_ENV:
    logging.warning("One or more critical Telegram credentials (API_ID, API_HASH, PHONE_NUMBER) are not set as environment variables. Using hardcoded fallbacks. This is insecure for production.")
if not TARGET_CHAT_INVITE_LINK_ENV:
    logging.warning("TELEGRAM_TARGET_CHAT_LINK environment variable is not set. Using hardcoded fallback.")


# --- Logging Setup ---
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# --- Backend Database Imports ---
# Assuming telegram_parser.py is in the same directory as main.py, crud.py etc.
# If not, adjust sys.path or use a proper package structure.
import crud
import models
import schemas
from database import SessionLocal, engine, get_db # get_db might be what we need
from sqlalchemy.orm import Session

# --- Telethon Client Initialization ---
# Initialize the client in the global scope so it can be used by different functions
client = TelegramClient(SESSION_NAME, API_ID, API_HASH, system_version="4.16.30-vxCUSTOM")

async def connect_and_login():
    """Connects to Telegram and ensures the user is logged in."""
    if not client.is_connected():
        await client.connect()
        logger.info("Connected to Telegram.")

    if not await client.is_user_authorized():
        logger.info("User is not authorized. Attempting to log in...")
        try:
            await client.send_code_request(PHONE_NUMBER)
            logger.info(f"Verification code sent to {PHONE_NUMBER}.")
            # In a non-interactive environment, this part is tricky.
            # For the first run, you might need to run this script interactively
            # to enter the code. Telethon will create a .session file.
            # Subsequent runs should use the session file automatically.
            # If running truly non-interactively from the start, a pre-existing session file is needed.
            code = input("Enter the Telegram code you received: ")
            await client.sign_in(PHONE_NUMBER, code)
            logger.info("Successfully signed in.")
        except errors.SessionPasswordNeededError:
            # This error means 2FA is enabled.
            # Handling 2FA (two-factor authentication)
            password = input("Two-factor authentication is enabled. Please enter your password: ")
            await client.sign_in(password=password)
            logger.info("Successfully signed in with 2FA.")
        except Exception as e:
            logger.error(f"Login failed: {e}")
            # Consider exiting or raising the exception if login is critical
            return False
    else:
        logger.info("User is already authorized.")
    return True

async def join_target_chat(chat_invite_link: str):
    """Joins the target chat if not already a member, using an invite link."""
    if not chat_invite_link.startswith('https://t.me/+') and not chat_invite_link.startswith('https://t.me/joinchat/'):
        logger.error(f"Invalid invite link format: {chat_invite_link}. Expected format like 'https://t.me/+' or 'https://t.me/joinchat/'.")
        logger.info("If it's a public chat, try using its username/ID directly with client.get_entity() and then JoinChannelRequest.")
        return None # Or raise an error

    try:
        # For invite links like https://t.me/+HASH or https://t.me/joinchat/HASH
        hash_part = chat_invite_link.split('/')[-1].lstrip('+') # Remove '+' if present

        # Check if already in chat by trying to get entity - this is a bit indirect for invite links
        # A more direct way is to just try joining. If already in, it usually doesn't error out badly.

        logger.info(f"Attempting to join chat using invite link hash: {hash_part}")
        updates = await client(ImportChatInviteRequest(hash_part))

        chat = None
        if hasattr(updates, 'chats') and updates.chats:
            chat = updates.chats[0] # Get the chat entity from the updates
            logger.info(f"Successfully joined or already a member of chat: {getattr(chat, 'title', chat.id)}")
            return chat # Return the chat entity
        else:
            logger.warning(f"Could not get chat entity after ImportChatInviteRequest for {chat_invite_link}. Updates: {updates}")
            # Fallback: Try to find the chat by iterating dialogs if join seemed to succeed but no entity returned directly.
            # This is less reliable.
            async for dialog in client.iter_dialogs():
                if hasattr(dialog.entity, 'megagroup') or hasattr(dialog.entity, 'broadcast'): # Check if it's a channel/supergroup
                    # This part is tricky as invite link doesn't directly give title to match
                    # We might need to rely on the fact that ImportChatInviteRequest should put us in the chat
                    # And then we can find it by some other means if needed, or assume we are in.
                    pass # For now, assume join worked if no error.
            return None # Could not definitively get the chat entity this way.

    except errors.UserAlreadyParticipantError:
        logger.info(f"Already a participant in the chat associated with {chat_invite_link}.")
        # If already a participant, we need to get the entity differently
        # This is complex because invite links don't directly map to a persistent ID easily without resolving them first.
        # For simplicity, if already joined, we might need another way to get the chat entity (e.g. iterating dialogs by title if known)
        # Or, if the link was previously resolved to an entity, that entity could be stored.
        # For now, we'll just log it. A robust solution might involve storing chat IDs after successful joins.
        # We can try to get the entity if we know the ID or title
        try:
            # This is a guess, if the CHAT_ID was a username or numeric ID, this would work.
            # But with an invite link, it's harder.
            # chat_entity = await client.get_entity(chat_invite_link) # This won't work directly with invite links usually
            # logger.info(f"Found entity for already joined chat: {getattr(chat_entity, 'title', chat_entity.id)}")
            # return chat_entity
            logger.warning("Could not retrieve entity for already-joined chat via invite link directly. Manual verification might be needed or use chat ID/username.")
            return None # Placeholder
        except Exception as e:
            logger.error(f"Error getting entity for already joined chat {chat_invite_link}: {e}")
            return None

    except errors.InviteHashExpiredError:
        logger.error(f"The invite link {chat_invite_link} has expired.")
        return None
    except errors.InviteHashInvalidError:
        logger.error(f"The invite link {chat_invite_link} is invalid.")
        return None
    except Exception as e:
        logger.error(f"Failed to join chat {chat_invite_link}: {e}")
        return None

async def main_parser_logic():
    """Main logic for the parser."""
    if not await connect_and_login():
        logger.error("Could not connect/login to Telegram. Exiting.")
        return

    target_chat_entity = await join_target_chat(TARGET_CHAT_INVITE_LINK)
    if not target_chat_entity:
        # If join_target_chat returns None but we are already a member,
        # we might need to manually find the chat entity if we know its ID or title.
        # For now, if it's None, we can't proceed with listening to that specific entity.
        # A robust solution would be to have a way to get the entity even if already joined.
        # One way is to iterate all dialogs and find the chat by its title, if known,
        # or if the CHAT_ID was a numerical ID or username.
        # This example assumes join_target_chat provides the entity or we can't proceed.
        logger.warning(f"Could not get target chat entity for {TARGET_CHAT_INVITE_LINK}. Further operations on this chat might fail.")
        # As a fallback, let's try to get the entity directly, assuming TARGET_CHAT_INVITE_LINK *might* be resolvable
        # This is often not the case for invite links directly.
        try:
            logger.info(f"Attempting to resolve {TARGET_CHAT_INVITE_LINK} as a general entity.")
            # This is a common pattern, but client.get_entity() doesn't work well with fresh invite links.
            # It's better to rely on the entity returned by ImportChatInviteRequest or JoinChannelRequest.
            # If already joined, we need a reliable way to get the chat (e.g. by its ID stored previously).
            # For this example, if target_chat_entity is None, we will not attach listeners.
        except Exception as e:
            logger.error(f"Could not resolve {TARGET_CHAT_INVITE_LINK} directly: {e}")
            logger.warning("Parser will not listen to this chat as entity resolution failed.")
            # Depending on requirements, you might want to exit or try other chats.

    # Placeholder for message listening logic (Step 2)
    logger.info("Setup complete. Message listening logic will be added in the next step.")
    # Example: if target_chat_entity: client.add_event_handler(..., NewMessage(chats=target_chat_entity))

    global resolved_target_chat_id # Use global to share with handler if needed, or pass via partial
    resolved_target_chat_id = None

    if target_chat_entity and hasattr(target_chat_entity, 'id'):
        resolved_target_chat_id = target_chat_entity.id
        logger.info(f"Successfully resolved target chat: {getattr(target_chat_entity, 'title', '')} (ID: {resolved_target_chat_id})")
        logger.info(f"Attaching message handler specifically for chat ID: {resolved_target_chat_id}")
        # The new_message_handler is already decorated with @client.on(events.NewMessage()).
        # To make it specific to a chat AFTER client initialization and entity resolution,
        # we would typically register it here IF it wasn't globally decorated, or the decorator itself would use a dynamic list.
        # Since it's globally decorated, we'll add a check inside the handler.
        # A cleaner way for dynamic chat targets is to not use a global decorator,
        # but client.add_event_handler(handler_function, events.NewMessage(chats=resolved_target_chat_id))
        # For now, the global handler will have an internal check.
    else:
        logger.warning(f"No target chat entity resolved or it has no ID. Parser may listen to all chats or fail to filter correctly for the target chat: {TARGET_CHAT_INVITE_LINK}")
        logger.info("The new_message_handler will currently process messages from ALL chats the user is in. This should be refined.")


    # Keep the client running until disconnected (e.g., by Ctrl+C)
    logger.info("Client setup complete. Running until disconnected.")
    await client.run_until_disconnected()


# --- Message Handling and Filtering ---
from telethon import events
from telethon.tl.types import Message # For type hinting

# TODO: Refine keywords and filtering logic
AD_KEYWORDS = ["продам", "куплю", "цена", "обмен", "торг", "рынок", "барахолка", "скидка", "новый", "б/у"]
import re # For regex-based extraction
from typing import Optional, Dict # For type hinting

# Keywords that might indicate an advertisement. This is a very basic filter.

def is_potential_ad(message_text: str) -> bool:
    """
    Simple keyword-based filter to check if a message might be an advertisement.
    Returns True if any keyword is found, False otherwise.
    """
    if not message_text:
        return False
    text_lower = message_text.lower()
    for keyword in AD_KEYWORDS:
        if keyword in text_lower:
            return True
    return False

# --- Information Extraction (Placeholder) ---
def extract_listing_details(message_text: str) -> Optional[Dict[str, any]]:
    """
    Placeholder function to extract listing details (title, price, description)
    from a message text. Uses a very naive regex and keyword approach.
    This should be replaced with a more sophisticated parser or AI model.
    """
    if not message_text:
        return None

    details = {
        "title": None,
        "price": None,
        "description": message_text # Default description is the full text
    }

    # Attempt to find a price (e.g., "цена 1000", "1000р", "1000 руб", "$1000")
    # This regex is very basic and will need significant improvement.
    # It looks for digits, possibly with a currency symbol or word nearby.
    price_patterns = [
        r"(\d[\d\s.,]*\d)\s*(?:р|руб|usd|\$|eur|€|тенге|тг)\b",  # 1000 руб, $100, 100.50 usd
        r"(?:цена|стоимость)\s*:?\s*(\d[\d\s.,]*\d)",           # цена: 1000, стоимость 100
        r"\b(\d[\d\s.,]*\d)\b" # Just a number, could be a price (less reliable)
    ]

    extracted_price_str = None
    for pattern in price_patterns:
        match = re.search(pattern, message_text, re.IGNORECASE)
        if match:
            price_str = match.group(1)
            # Clean up price string (remove spaces, replace comma with dot)
            price_str_cleaned = price_str.replace(" ", "").replace(",", ".")
            try:
                details["price"] = float(price_str_cleaned)
                extracted_price_str = price_str # Keep original matched part for description removal
                logger.info(f"    Extracted price: {details['price']} from '{price_str}'")
                break
            except ValueError:
                logger.warning(f"    Could not convert found price '{price_str_cleaned}' to float.")
                continue # Try next pattern

    # Attempt to define a title (e.g., the first line, or text before "цена")
    lines = message_text.split('\n')
    if lines:
        potential_title = lines[0].strip()
        # If price was found, try to take text before it as title
        if extracted_price_str:
            price_index = message_text.lower().find(extracted_price_str.lower())
            if price_index > 0:
                title_candidate_before_price = message_text[:price_index].strip()
                # Prefer shorter, non-empty title from before price if available
                if title_candidate_before_price and (len(title_candidate_before_price) < len(potential_title) or not potential_title):
                    potential_title = title_candidate_before_price.split('\n')[-1].strip() # Last line before price
                elif not potential_title: # if first line was empty
                     potential_title = title_candidate_before_price.split('\n')[-1].strip()


        # Basic filtering for very long first lines or common non-title phrases
        if len(potential_title) > 100 or potential_title.lower().startswith(("http", "www")):
            details["title"] = "Объявление" # Generic title
        else:
            details["title"] = potential_title if potential_title else "Объявление"
    else:
        details["title"] = "Объявление" # Generic title if message is empty or unusual

    # Refine description: remove title part if it's the beginning of the description
    if details["title"] and details["title"] != "Объявление":
        if message_text.startswith(details["title"]):
            details["description"] = message_text[len(details["title"]):].strip()

    # Further refine description: remove price part if found and part of description
    if extracted_price_str and details["price"] is not None:
        # This is tricky, as price might be naturally part of description.
        # For a naive approach, if the exact price string is there, remove one instance.
        # A more robust way would be to mark spans of text.
        # For now, this might be too aggressive or not effective.
        # Let's assume description is full text minus title for simplicity for now,
        # or rely on AI in future to segment better.
        pass # Current description logic is sufficient for a placeholder

    # Fallback if no price found but "договорная" or "бесплатно" is mentioned
    if details["price"] is None:
        if re.search(r"\b(договорная|бесплатно|отдам даром)\b", message_text, re.IGNORECASE):
            details["price"] = 0.00 # Represent as 0.00 for now
            logger.info("    Price set to 0.00 due to 'договорная' or 'бесплатно'.")

    # A listing needs at least a title and a price to be somewhat valid
    if not details["title"] or details["price"] is None:
        logger.info(f"    Could not extract essential details (title/price) for a valid listing. Title: '{details['title']}', Price: {details['price']}")
        return None # Not enough info for a listing

    logger.info(f"    Attempted extraction - Title: '{details['title']}', Price: {details['price']}")
    return details


@client.on(events.NewMessage()) # By default, listens to all chats the user is in. We can specify chats.
async def new_message_handler(event: events.NewMessage.Event):
    """Handles new incoming messages."""
    message = event.message
    chat = await event.get_chat() # Get chat entity where message was sent

    # For debugging: Log all messages from target chat if entity is known
    # Or, if we want to process messages only from the specific TARGET_CHAT_INVITE_LINK chat,
    # we need to ensure we have its entity and compare.
    # This is where having a reliable way to get chat_id for TARGET_CHAT_INVITE_LINK is crucial.

    # For now, let's assume we want to process messages from any chat and log where they came from.
    # A better approach for production is to only listen to specific chat(s).
    # If target_chat_entity was resolved in main_parser_logic, we could do:
    if not chat or not resolved_target_chat_id or chat.id != resolved_target_chat_id:
        # This message is not from the target chat we successfully joined and resolved.
        # logger.debug(f"Ignoring message from chat '{getattr(chat, 'title', 'Unknown')}' (ID: {chat.id if chat else 'Unknown'}) as it's not the target chat (ID: {resolved_target_chat_id}).")
        return # Ignore messages not from the target chat

    # Log only messages from the target chat
    logger.info(f"New message from TARGET CHAT ({getattr(chat, 'title', chat.id)} - ID: {chat.id}): '{message.text[:70]}...'")

    # --- Filtering Logic (only for target chat messages) ---
    if is_potential_ad(message.text):
        logger.info(f"  [!] Potential ad detected. Message ID: {message.id}. Attempting to extract details...")
        extracted_info = extract_listing_details(message.text) # This is a sync function

        if extracted_info:
            logger.info(f"    Successfully extracted: Title='{extracted_info['title']}', Price={extracted_info['price']}")
            # --- Database Integration ---
            sender = await event.get_sender()
            if sender:
                # We need a database session
                # Note: Using get_db like this in a long-running script can be problematic
                # if the session management isn't handled carefully (e.g. closing sessions).
                # For a simple script, getting a new session per operation might be okay,
                # but for high throughput, a session pool or more careful management is needed.
                # This also assumes database.py is in the same directory or Python path.

                # Create a new database session for this operation
                db: Session = SessionLocal()
                try:
                    parser_user = await get_or_create_parser_user(
                        db,
                        telegram_user_id=sender.id,
                        telegram_username=sender.username,
                        full_name=f"{sender.first_name or ''} {sender.last_name or ''}".strip() or sender.username or f"TGUser_{sender.id}"
                    )
                    if parser_user:
                        listing_data = schemas.ListingCreate(
                            title=extracted_info["title"],
                            description=extracted_info["description"],
                            price=extracted_info["price"]
                        )
                        db_listing = crud.create_user_listing(db=db, listing=listing_data, user_id=parser_user.id)
                        logger.info(f"    Successfully saved listing '{db_listing.title}' (ID: {db_listing.id}) to DB for user {parser_user.telegram_id}.")
                    else:
                        logger.error(f"    Could not get or create user for sender ID {sender.id}. Listing not saved.")
                except Exception as e:
                    logger.error(f"    Error during database operation: {e}")
                    db.rollback() # Rollback on error
                finally:
                    db.close() # Ensure the session is closed
            else:
                logger.warning("    Could not get sender information for the message. Listing not saved.")
        else:
            logger.info("    Could not extract sufficient details from potential ad.")
    else:
        logger.debug(f"  [-] Message (ID: {message.id}) from target chat does not seem like an ad.")


if __name__ == '__main__':
    # The main_parser_logic now includes client.run_until_disconnected()
    # which will block and keep the script running.
    asyncio.run(main_parser_logic())
    logger.info("Telegram parser script finished (should only happen on explicit stop or error).")


# --- Database User Management for Parser ---
async def get_or_create_parser_user(db: Session, telegram_user_id: int, telegram_username: Optional[str], full_name: str) -> Optional[models.User]:
    """
    Retrieves an existing user or creates a new one based on Telegram sender information.
    This is specific to how the parser creates/attributes users.
    """
    # Try to find user by telegram_id first
    user = db.query(models.User).filter(models.User.telegram_id == telegram_user_id).first()
    if user:
        # Optionally update username or full_name if they changed
        # For now, just return the found user
        logger.debug(f"Found existing user in DB with Telegram ID: {telegram_user_id}")
        return user

    # If user not found by telegram_id, try by username if it exists (less reliable as usernames can change)
    # This part might be optional depending on how strictly you want to link accounts.
    # For ads, telegram_id is the primary key.
    # if telegram_username:
    #     user = db.query(models.User).filter(models.User.telegram_username == telegram_username).first()
    #     if user:
    #         # Found by username, but ID was different or not set. Update telegram_id if it's missing.
    #         if user.telegram_id is None:
    #             user.telegram_id = telegram_user_id
    #             db.commit()
    #         logger.debug(f"Found existing user in DB by Telegram Username: {telegram_username} (ID: {user.id})")
    #         return user

    # If still no user, create a new one
    logger.info(f"Creating new user in DB for Telegram ID: {telegram_user_id}, Username: {telegram_username}, Full Name: {full_name}")

    # Use a structure similar to crud.get_or_create_user if it has more sophisticated logic
    # For now, direct creation:
    new_user = models.User(
        telegram_id=telegram_user_id,
        telegram_username=telegram_username,
        full_name=full_name,
        # avatar_url could be fetched if needed, Telethon sender object might have profile photo info
    )
    db.add(new_user)
    try:
        db.commit()
        db.refresh(new_user)
        logger.info(f"Successfully created new user with ID: {new_user.id}")
        return new_user
    except Exception as e:
        logger.error(f"Failed to create new user for Telegram ID {telegram_user_id}: {e}")
        db.rollback()
        return None
