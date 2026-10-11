package app.smarttap.ui

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import app.smarttap.CardsUiState
import app.smarttap.data.TapCard
import com.clerk.ui.userbutton.UserButton

private const val NFC_CARD_EXPLANATION = "Another phone taps this card to open your link."

@OptIn(ExperimentalMaterial3Api::class)
@Composable
internal fun CardList(
    cards: CardsUiState,
    refreshing: Boolean,
    refreshError: String?,
    onRefresh: () -> Unit,
    onOpenCard: (Long) -> Unit,
    onShowAdd: () -> Unit,
    onShowEdit: (Long) -> Unit,
    onShowTrash: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Scaffold(
        modifier = modifier,
        topBar = {
            TopAppBar(
                title = { Text("NFC cards") },
                actions = {
                    IconButton(
                        onClick = onRefresh,
                        enabled = cards !is CardsUiState.Loading && !refreshing,
                    ) {
                        if (refreshing) {
                            CircularProgressIndicator(
                                modifier = Modifier.size(20.dp),
                                strokeWidth = 2.dp,
                            )
                        } else {
                            Icon(Icons.Filled.Refresh, contentDescription = "Refresh cards")
                        }
                    }
                    UserButton()
                },
            )
        },
        floatingActionButton = {
            FloatingActionButton(onClick = onShowAdd) {
                Icon(Icons.Filled.Add, contentDescription = "Add card")
            }
        },
    ) { innerPadding ->
        Column(
            modifier =
                Modifier
                    .fillMaxSize()
                    .padding(innerPadding)
                    .padding(horizontal = 16.dp),
        ) {
            Text(
                NFC_CARD_EXPLANATION,
                modifier = Modifier.padding(bottom = 8.dp),
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                style = MaterialTheme.typography.bodyLarge,
            )
            if (refreshError != null) {
                Text(
                    refreshError,
                    modifier = Modifier.padding(bottom = 8.dp),
                    color = MaterialTheme.colorScheme.error,
                    style = MaterialTheme.typography.bodyMedium,
                )
            }
            Box(modifier = Modifier.weight(1f).fillMaxWidth()) {
                when (cards) {
                    CardsUiState.Loading -> {
                        CircularProgressIndicator(modifier = Modifier.padding(top = 24.dp))
                    }

                    is CardsUiState.Failed -> {
                        Column {
                            Text(cards.message)
                            TextButton(onClick = onRefresh) { Text("Try again") }
                        }
                    }

                    is CardsUiState.Ready -> {
                        if (cards.cards.isEmpty()) {
                            Text("No cards yet.")
                        } else {
                            LazyColumn(
                                modifier = Modifier.fillMaxSize(),
                                contentPadding = PaddingValues(top = 8.dp, bottom = 16.dp),
                                verticalArrangement = Arrangement.spacedBy(20.dp),
                            ) {
                                items(cards.cards, key = { it.id }) { card ->
                                    WalletCard(
                                        card = card,
                                        onOpen = { onOpenCard(card.id) },
                                        onEdit = { onShowEdit(card.id) },
                                    )
                                }
                            }
                        }
                    }
                }
            }
            TextButton(
                onClick = onShowTrash,
                modifier = Modifier.padding(end = 72.dp, bottom = 4.dp),
                contentPadding = PaddingValues(horizontal = 8.dp, vertical = 0.dp),
            ) {
                Icon(
                    Icons.Filled.Delete,
                    contentDescription = null,
                    modifier = Modifier.size(18.dp),
                )
                Spacer(Modifier.width(6.dp))
                Text("Deleted cards")
            }
        }
    }
}

@Composable
private fun WalletCard(
    card: TapCard,
    onOpen: () -> Unit,
    onEdit: () -> Unit,
) {
    Column(modifier = Modifier.fillMaxWidth()) {
        CardFace(
            title = card.title,
            imageUrl = card.imageUrl,
            imageAlignment = Alignment.TopCenter,
            modifier = Modifier.fillMaxWidth().height(112.dp),
            onClick = onOpen,
            titleStyle = MaterialTheme.typography.titleLarge,
        )
        Row(
            modifier =
                Modifier
                    .fillMaxWidth()
                    .padding(start = 20.dp, top = 4.dp, end = 4.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Text(
                card.destinationUrl,
                modifier = Modifier.weight(1f),
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                style = MaterialTheme.typography.bodySmall,
            )
            Box(
                modifier =
                    Modifier
                        .size(32.dp)
                        .clickable(role = Role.Button, onClick = onEdit),
                contentAlignment = Alignment.Center,
            ) {
                Icon(
                    Icons.Filled.Edit,
                    contentDescription = "Edit",
                    modifier = Modifier.size(18.dp),
                    tint = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
        }
    }
}
