<?php
// Session check goes here.

$contacts = [
    ['id' => 1, 'name' => 'Monke J. Monkey'],
    ['id' => 2, 'name' => 'Jason P. Truvagoo'],
    ['id' => 3, 'name' => 'Sally Z. Pablo'],
    ['id' => 4, 'name' => 'John J. Latta'],
    ['id' => 5, 'name' => 'Icarus B. Bentil'],
];

function e($value) {
    return htmlspecialchars((string) $value, ENT_QUOTES, 'UTF-8');
}
?>

<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Dashboard | Contact Manager</title>
        <link rel="stylesheet" href="css/style.css">
    </head>
    <body>
        <div class="dashboard-container">
            <div class="dashboard-inner">
                <div class="contact-list-section">
                    <div class="contact-list">
                        <div class="contact-list-header">
                            <h2>{ Your Contacts }</h2>
                        </div>
                        <div class="contact-list-search">
                            <input class="contact-search-input" type="search" name="contact_search" placeholder="Search contacts">
                        </div>
                        <ul class="contact-list-items">
                            <?php foreach ($contacts as $contact): ?>
                            <li class="contact-list-item<?= $contact['id'] === 1 ? ' is-active' : '' ?>"<?= $contact['id'] === 1 ? ' aria-current="true"' : '' ?>>
                                <div class="contact-list-avatar"></div>
                                <div class="contact-list-name">
                                    <h3><?= e($contact['name']) ?></h3>
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
                    <div class="contact-details-header"></div>
                    <div class="contact-details-view">
                        <div class="contact-view-header">
                            <h2>Contact Details</h2>
                            <div class="contact-view-actions">
                                <button class="btn-contact-view-action" type="button" aria-label="Edit contact" title="Edit contact">
                                    <svg class="contact-edit-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24">
                                        <path d="M4 20h4L19 9l-4-4L4 16v4M13 7l4 4"></path>
                                    </svg>
                                </button>
                                <form action="api/delete-contact.php" method="POST">
                                    <input type="hidden" name="contact_id" value="1">
                                    <button class="btn-contact-view-action" type="submit" aria-label="Delete contact" title="Delete contact">
                                        <svg class="delete-contact-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24">
                                            <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v5M14 11v5"></path>
                                        </svg>
                                    </button>
                                </form>
                            </div>
                        </div>
                        <div class="contact-view-body">
                            <div class="contact-view-avatar-section">
                                <div class="contact-view-avatar"></div>
                            </div>
                            <div class="contact-view-info">
                                <div class="contact-view-name">
                                    <h3>Monke J. Monkey</h3>
                                </div>
                                <div class="contact-view-field">
                                    <span class="contact-view-label">Email Address</span>
                                    <div class="contact-view-email">
                                        <h3>john.monkey@example.com</h3>
                                    </div>
                                </div>
                                <div class="contact-view-field">
                                    <span class="contact-view-label">Phone Number</span>
                                    <div class="contact-view-phone">
                                        <h3>555-555-5555</h3>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
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
