<?php
session_start();

if (!isset($_SESSION['userId'])) {
    header('Location: index.php');
    exit;
}
//Show the real contacts from the DB
require_once __DIR__ . '/api/config/db.php';

$db = getDB();

$userId = $_SESSION['userId'];

$stmt = $db->prepare(
    'SELECT ID, FirstName, LastName, UserID, Phone, Email, Created
     FROM Contacts
     WHERE UserID = ?
     ORDER BY LastName, FirstName'
);

$stmt->execute([$userId]);

$contacts = $stmt->fetchAll(PDO::FETCH_ASSOC);

$selectedContactId = $contacts[0]['ID'] ?? null;

$selectedContact = $contacts[0] ?? null;

function e($value) {
    return htmlspecialchars((string) $value, ENT_QUOTES, 'UTF-8');
}

function formatDate($value) {
    return date('M j, Y', strtotime($value));
}

function isoDate($value) {
    return date('Y-m-d', strtotime($value));
}
?>

<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Dashboard | Contact Manager</title>
        <link rel="stylesheet" href="css/style.css">
        <script src="js/site.js" type="module"></script>
        <script src="js/app.js" type="module"></script>
    </head>
    <body>
        <div class="dashboard-container">
            <div class="dashboard-inner">
                <div class="contact-list-section">
                    <div class="contact-list">
                        <div class="contact-list-header">
                            <h2>{ Contact Manager }</h2>
                        </div>
                        <div class="contact-list-search">
                            <input class="contact-search-input" type="search" name="contact_search" placeholder="Search contacts">
                        </div>
                        <ul class="contact-list-items">
                            <?php foreach ($contacts as $contact): ?>
                                <li class="contact-list-item<?= (int)$contact['ID'] === (int)$selectedContactId ? ' is-active' : '' ?>"
                                    <?= (int)$contact['ID'] === (int)$selectedContactId ? 'aria-current="true"' : '' ?>>
                                        <div class="contact-list-avatar" aria-hidden="true">
                                     <?= e(strtoupper(substr($contact['FirstName'], 0, 1))) ?><?= e(strtoupper(substr($contact['LastName'], 0, 1))) ?>
                            </div>

                         <div class="contact-list-name">
                             <h3><?= e($contact['FirstName']) ?> <?= e($contact['LastName']) ?></h3>
                             </div>

                                </li>
                            <?php endforeach; ?>
                            <li class="contact-list-action-item">
                                <button class="btn-contact-action" type="button" aria-label="Add contact" title="Add contact">
                                    <svg class="contact-action-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24">
                                        <path d="M12 5v14M5 12h14"></path>
                                    </svg>
                                </button>
                            </li>
                        </ul>
                    </div>
                    <div class="contact-list-spacer"></div>
                    <div class="contact-list-logout">
                        <form action="api/logout.php" method="POST">
                            <button class="btn-primary logout-button" type="submit">Logout</button>
                        </form>
                    </div>
                </div>
                <div class="contact-details">
                    <article class="contact-details-view" aria-labelledby="contact-view-name">
                        <header class="contact-view-identity">
                            <div class="contact-view-avatar" aria-hidden="true">MM</div>
                            <div class="contact-view-title">
                                <h2 id="contact-view-name">
                                 <?= e($selectedContact['FirstName'] ?? '') ?>
                                 <?= e($selectedContact['LastName'] ?? '') ?>
                                </h2>
                                <dl class="contact-view-meta">
                                    <div class="contact-view-meta-item">
                                        <dt>Contact since</dt>
                                        <dd><time datetime="<?= e(isoDate($selectedContact['Created'])) ?>"><?= e(formatDate($selectedContact['Created'])) ?></time></dd>
                                    </div>
                                </dl>
                            </div>
                            <div class="contact-view-actions">
                                <button class="btn-contact-view-action" type="button" aria-label="Edit contact" title="Edit contact">
                                    <svg class="contact-edit-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24">
                                        <path d="M4 20h4L19 9l-4-4L4 16v4M13 7l4 4"></path>
                                    </svg>
                                    <span class="btn-contact-view-action-text">Edit</span>
                                </button>
                                <form action="api/delete-contact.php" method="POST">
                                    <button
                                        class="btn-contact-view-action"
                                        type="button"
                                         id="delete-contact-button"
                                         aria-label="Delete contact"
                                         title="Delete contact"
                                         data-contact-id="<?= e($selectedContactId) ?>"
                                    >
                                         <svg class="delete-contact-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24">
                                         <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10   11v5M14 11v5"></path>
                                         </svg>
                                   <span class="btn-contact-view-action-text">Delete</span>
                                 </button>
                                </form>
                            </div>
                        </header>
                        <ul class="contact-view-fields">
                            <li class="contact-view-field">
                                <button class="contact-view-copy" type="button" aria-label="Copy email address" title="Copy email address">
                                    <svg class="contact-view-copy-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                                        <path d="M3 6h18v12H3zM3 7l9 7 9-7"></path>
                                    </svg>
                                    <svg class="contact-view-copied-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                                        <path d="M5 12l5 5 9-10"></path>
                                    </svg>
                                </button>
                                <span class="contact-view-field-text">
                                    <span class="contact-view-label">Email address</span>
                                    <span class="contact-view-value">
                                     <?= e($selectedContact['Email'] ?? '') ?>
                                    </span>
                                </span>
                                <a class="contact-view-field-action" href="mailto:<?= e($selectedContact['Email'] ?? '') ?>" aria-label="Send email">
                                    <span class="contact-view-field-action-text">Email</span>
                                    <span class="contact-view-field-action-arrow" aria-hidden="true">&#8599;</span>
                                </a>
                            </li>
                            <li class="contact-view-field">
                                <button class="contact-view-copy" type="button" aria-label="Copy phone number" title="Copy phone number">
                                    <svg class="contact-view-copy-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                                        <path d="M7 3H4.5A1.5 1.5 0 003 4.5C3 13.6 10.4 21 19.5 21a1.5 1.5 0 001.5-1.5V17l-5-1-1.2 3a15.8 15.8 0 01-9.8-9.8L8 8 7 3z"></path>
                                    </svg>
                                    <svg class="contact-view-copied-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                                        <path d="M5 12l5 5 9-10"></path>
                                    </svg>
                                </button>
                                <span class="contact-view-field-text">
                                    <span class="contact-view-label">Phone number</span>
                                   <span class="contact-view-value">
                                      <?= e($selectedContact['Phone'] ?? '') ?>     
                                    </span>
                                </span>
                               <a class="contact-view-field-action" href="tel:<?= e($selectedContact['Phone'] ?? '') ?>" aria-label="Call phone number">
                                    <span class="contact-view-field-action-text">Call</span>
                                    <span class="contact-view-field-action-arrow" aria-hidden="true">&#8599;</span>
                                </a>
                            </li>
                        </ul>
                        <p class="visually-hidden" id="copy-status" aria-live="polite"></p>
                    </article>
                    <div class="contact-details-form">
                        <div class="contact-form-header">
                            <h2>CREATE NEW CONTACT</h2>
                        </div>
                        <form class="contact-form" action="api/add-contact.php" method="POST">
                            <div class="contact-form-fields">
                                <div class="contact-form-field">
                                    <label for="first-name">First Name</label>
                                    <input type="text" name="first_name" id="first-name" class="form-input" placeholder="John">
                                </div>
                                <div class="contact-form-field">
                                    <label for="last-name">Last Name</label>
                                    <input type="text" name="last_name" id="last-name" class="form-input" placeholder="Doe">
                                </div>
                                <div class="contact-form-field">
                                    <label for="email">Email Address</label>
                                    <input type="email" name="email" id="email" class="form-input" placeholder="john.doe@example.com">
                                </div>
                                <div class="contact-form-field">
                                    <label for="phone">Phone Number</label>
                                    <input type="tel" name="phone" id="phone" class="form-input" placeholder="555-555-5555">
                                </div>
                            </div>
                            <div class="contact-form-footer">
                                <button class="btn-primary" type="submit">Add Contact</button>
                            </div>
                        </form>
                    </div>
                    <div class="contact-details-bottom-border"></div>
                </div>
            </div>
        </div>
    </body>
</html>
